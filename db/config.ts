import { column, defineDb, defineTable } from 'astro:db';

const Usuarios = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    email: column.text({ unique: true }),
    nombre: column.text(),
    rol: column.text(),
    telefono: column.text(),
    password_hash: column.text(),
  },
});

const Productos = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    nombre: column.text(),
    categoria: column.text(),
    precio: column.number(),
    stock: column.number(),
    compatible_starlink: column.boolean(),
    oferta: column.text({ optional: true }),
    imagen_url: column.text({ optional: true }),
  },
});

const Comprobantes = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    dni_ruc: column.text(),
    nombre_cliente: column.text(),
    producto_id: column.number({ references: () => Productos.columns.id }),
    vendedor_id: column.number({ references: () => Usuarios.columns.id }),
    cantidad: column.number(),
    precio_unitario: column.number(),
    fecha: column.date(),
    estado: column.text(),
  },
});

const Sesiones = defineTable({
  columns: {
    token: column.text({ primaryKey: true }),
    usuario_id: column.number({ references: () => Usuarios.columns.id }),
    expira: column.date(),
  },
});

export default defineDb({
  tables: {
    Usuarios,
    Productos,
    Comprobantes,
    Sesiones,
  },
});
