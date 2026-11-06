import { ActionError, defineAction } from 'astro:actions';
import { Comprobantes, db, desc, eq, Productos, Usuarios } from 'astro:db';
import { z } from 'astro/zod';
import { cerrarSesion, crearSesion, verifyPassword } from '../lib/auth';

const esquemaComprobante = z.object({
  dni_ruc: z
    .string({ error: 'El DNI o RUC es obligatorio.' })
    .trim()
    .regex(/^(\d{8}|\d{11})$/, {
      error: 'Ingresa un DNI de 8 dígitos o un RUC de 11 dígitos.',
    }),
  nombre_cliente: z
    .string({ error: 'El nombre del cliente es obligatorio.' })
    .trim()
    .min(2, { error: 'Ingresa el nombre del cliente (mínimo 2 caracteres).' }),
  producto_id: z.coerce
    .number({ error: 'Selecciona un producto válido.' })
    .int({ error: 'Selecciona un producto válido.' })
    .positive({ error: 'Selecciona un producto.' }),
  cantidad: z.coerce
    .number({ error: 'Ingresa una cantidad numérica válida.' })
    .int({ error: 'La cantidad debe ser un número entero.' })
    .min(1, { error: 'La cantidad debe ser al menos 1.' }),
});

const esquemaProductoBase = z.object({
  nombre: z
    .string({ error: 'El nombre del producto es obligatorio.' })
    .trim()
    .min(2, { error: 'Ingresa el nombre del equipo (mínimo 2 caracteres).' }),
  categoria: z.enum(['Celular', 'Accesorios', 'Conectividad'], {
    error: 'Selecciona una categoría válida.',
  }),
  precio: z.coerce
    .number({ error: 'Ingresa un precio numérico válido.' })
    .gt(0, { error: 'El precio debe ser mayor a S/ 0.' }),
  stock: z.coerce
    .number({ error: 'Ingresa un stock numérico válido.' })
    .int({ error: 'El stock debe ser un número entero.' })
    .min(0, { error: 'El stock no puede ser negativo.' }),
  compatible_starlink: z.string().optional(),
  oferta: z.string().trim().optional(),
});

export const server = {
  login: defineAction({
    accept: 'form',
    input: z.object({
      email: z.email({ error: 'Ingresa un correo electrónico válido.' }),
      password: z
        .string({ error: 'Ingresa tu contraseña.' })
        .min(1, { error: 'Ingresa tu contraseña.' }),
    }),
    handler: async function (input, context) {
      const filas = await db
        .select()
        .from(Usuarios)
        .where(eq(Usuarios.email, input.email.toLowerCase()));
      const usuario = filas[0];

      if (!usuario || !verifyPassword(input.password, usuario.password_hash)) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Correo o contraseña incorrectos.',
        });
      }

      await crearSesion(usuario.id, context.cookies);
      return { ok: true };
    },
  }),

  logout: defineAction({
    accept: 'form',
    handler: async function (_input, context) {
      await cerrarSesion(context.cookies);
      return { ok: true };
    },
  }),

  crearComprobante: defineAction({
    accept: 'form',
    input: esquemaComprobante,
    handler: async function (input, context) {
      const usuario = context.locals.user;
      if (!usuario) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión para registrar un comprobante.',
        });
      }

      const productos = await db
        .select()
        .from(Productos)
        .where(eq(Productos.id, input.producto_id));
      const producto = productos[0];

      if (!producto) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'El producto seleccionado no existe.',
        });
      }

      const ultimos = await db
        .select({ id: Comprobantes.id })
        .from(Comprobantes)
        .orderBy(desc(Comprobantes.id))
        .limit(1);
      const nuevoId = ultimos[0] ? Math.max(ultimos[0].id + 1, 1001) : 1001;

      await db.insert(Comprobantes).values({
        id: nuevoId,
        dni_ruc: input.dni_ruc,
        nombre_cliente: input.nombre_cliente,
        producto_id: producto.id,
        vendedor_id: usuario.id,
        cantidad: input.cantidad,
        precio_unitario: producto.precio,
        fecha: new Date(),
        estado: 'Pendiente',
      });

      return { id: nuevoId };
    },
  }),

  editarComprobante: defineAction({
    accept: 'form',
    input: esquemaComprobante.extend({
      id: z.coerce.number().int().positive(),
    }),
    handler: async function (input, context) {
      const usuario = context.locals.user;
      if (!usuario) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión.',
        });
      }

      const filas = await db
        .select()
        .from(Comprobantes)
        .where(eq(Comprobantes.id, input.id));
      const comprobante = filas[0];

      if (!comprobante) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: 'El comprobante no existe.',
        });
      }

      if (usuario.rol !== 'Administrador' && comprobante.vendedor_id !== usuario.id) {
        throw new ActionError({
          code: 'FORBIDDEN',
          message: 'Solo puedes editar tus propios comprobantes.',
        });
      }

      if (comprobante.estado !== 'Pendiente') {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'Solo se pueden editar comprobantes en estado Pendiente.',
        });
      }

      const productos = await db
        .select()
        .from(Productos)
        .where(eq(Productos.id, input.producto_id));
      const producto = productos[0];

      if (!producto) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'El producto seleccionado no existe.',
        });
      }

      const nuevoPrecioUnitario =
        producto.id === comprobante.producto_id ? comprobante.precio_unitario : producto.precio;

      await db
        .update(Comprobantes)
        .set({
          dni_ruc: input.dni_ruc,
          nombre_cliente: input.nombre_cliente,
          producto_id: producto.id,
          cantidad: input.cantidad,
          precio_unitario: nuevoPrecioUnitario,
        })
        .where(eq(Comprobantes.id, comprobante.id));

      return { id: comprobante.id };
    },
  }),

  emitirComprobante: defineAction({
    accept: 'form',
    input: z.object({
      id: z.coerce.number().int().positive(),
    }),
    handler: async function (input, context) {
      const usuario = context.locals.user;
      if (!usuario) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión.',
        });
      }

      const filas = await db
        .select()
        .from(Comprobantes)
        .where(eq(Comprobantes.id, input.id));
      const comprobante = filas[0];

      if (!comprobante) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: 'El comprobante no existe.',
        });
      }

      if (comprobante.estado !== 'Pendiente') {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'Solo se puede emitir un comprobante en estado Pendiente.',
        });
      }

      const productos = await db
        .select()
        .from(Productos)
        .where(eq(Productos.id, comprobante.producto_id));
      const producto = productos[0];

      if (!producto) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: 'El producto asociado no existe.',
        });
      }

      if (producto.stock < comprobante.cantidad) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: `Stock insuficiente (${producto.stock} disponibles, se requieren ${comprobante.cantidad}).`,
        });
      }

      await db.batch([
        db
          .update(Productos)
          .set({ stock: producto.stock - comprobante.cantidad })
          .where(eq(Productos.id, producto.id)),
        db
          .update(Comprobantes)
          .set({ estado: 'Emitido' })
          .where(eq(Comprobantes.id, comprobante.id)),
      ]);

      return { id: comprobante.id };
    },
  }),

  anularComprobante: defineAction({
    accept: 'form',
    input: z.object({
      id: z.coerce.number().int().positive(),
    }),
    handler: async function (input, context) {
      const usuario = context.locals.user;
      if (!usuario || usuario.rol !== 'Administrador') {
        throw new ActionError({
          code: 'FORBIDDEN',
          message: 'Solo el Administrador puede anular comprobantes.',
        });
      }

      const filas = await db
        .select()
        .from(Comprobantes)
        .where(eq(Comprobantes.id, input.id));
      const comprobante = filas[0];

      if (!comprobante) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: 'El comprobante no existe.',
        });
      }

      if (comprobante.estado === 'Anulado') {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'El comprobante ya está anulado.',
        });
      }

      if (comprobante.estado === 'Emitido') {
        const productos = await db
          .select()
          .from(Productos)
          .where(eq(Productos.id, comprobante.producto_id));
        const producto = productos[0];

        if (producto) {
          await db.batch([
            db
              .update(Productos)
              .set({ stock: producto.stock + comprobante.cantidad })
              .where(eq(Productos.id, producto.id)),
            db
              .update(Comprobantes)
              .set({ estado: 'Anulado' })
              .where(eq(Comprobantes.id, comprobante.id)),
          ]);
          return { id: comprobante.id };
        }
      }

      await db
        .update(Comprobantes)
        .set({ estado: 'Anulado' })
        .where(eq(Comprobantes.id, comprobante.id));

      return { id: comprobante.id };
    },
  }),

  crearProducto: defineAction({
    accept: 'form',
    input: esquemaProductoBase,
    handler: async function (input, context) {
      const usuario = context.locals.user;
      if (!usuario || usuario.rol !== 'Administrador') {
        throw new ActionError({
          code: 'FORBIDDEN',
          message: 'Solo el Administrador puede crear productos.',
        });
      }

      const ultimos = await db
        .select({ id: Productos.id })
        .from(Productos)
        .orderBy(desc(Productos.id))
        .limit(1);
      const nuevoId = ultimos[0] ? ultimos[0].id + 1 : 1;

      await db.insert(Productos).values({
        id: nuevoId,
        nombre: input.nombre,
        categoria: input.categoria,
        precio: input.precio,
        stock: input.stock,
        compatible_starlink:
          input.compatible_starlink === 'on' || input.compatible_starlink === 'true',
        oferta: input.oferta || '',
        imagen_url: '',
      });

      return { id: nuevoId };
    },
  }),

  editarProducto: defineAction({
    accept: 'form',
    input: esquemaProductoBase.extend({
      id: z.coerce.number().int().positive(),
    }),
    handler: async function (input, context) {
      const usuario = context.locals.user;
      if (!usuario || usuario.rol !== 'Administrador') {
        throw new ActionError({
          code: 'FORBIDDEN',
          message: 'Solo el Administrador puede editar productos.',
        });
      }

      const filas = await db
        .select()
        .from(Productos)
        .where(eq(Productos.id, input.id));
      if (!filas[0]) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: 'El producto no existe.',
        });
      }

      await db
        .update(Productos)
        .set({
          nombre: input.nombre,
          categoria: input.categoria,
          precio: input.precio,
          stock: input.stock,
          compatible_starlink:
            input.compatible_starlink === 'on' || input.compatible_starlink === 'true',
          oferta: input.oferta || '',
        })
        .where(eq(Productos.id, input.id));

      return { id: input.id };
    },
  }),
};
