import { Comprobantes, db, Productos, Usuarios } from 'astro:db';
import { hashPassword } from '../src/lib/auth';

export default async function seed(): Promise<void> {
  await db.insert(Usuarios).values([
    {
      id: 1,
      email: 'carlos.vendedor@kuruk.pe',
      nombre: 'Carlos Mendoza',
      rol: 'Vendedor',
      telefono: '982123456',
      password_hash: hashPassword('kuruk123'),
    },
    {
      id: 2,
      email: 'admin@kuruk.pe',
      nombre: 'Administrador KURUK',
      rol: 'Administrador',
      telefono: '982987654',
      password_hash: hashPassword('admin123'),
    },
    {
      id: 3,
      email: 'lucia.vendedor@kuruk.pe',
      nombre: 'Lucía Quispe',
      rol: 'Vendedor',
      telefono: '982555111',
      password_hash: hashPassword('kuruk123'),
    },
  ]);

  await db.insert(Productos).values([
    {
      id: 1,
      nombre: 'Samsung Galaxy S24 Ultra',
      categoria: 'Celular',
      precio: 4899,
      stock: 5,
      compatible_starlink: true,
      oferta: 'Case / Cargador gratis',
      imagen_url: '',
    },
    {
      id: 2,
      nombre: 'iPhone 15 Pro Max',
      categoria: 'Celular',
      precio: 5299,
      stock: 3,
      compatible_starlink: true,
      oferta: '5% descuento en efectivo',
      imagen_url: '',
    },
    {
      id: 3,
      nombre: 'Kit Antena Starlink V4',
      categoria: 'Conectividad',
      precio: 1899,
      stock: 8,
      compatible_starlink: true,
      oferta: 'Instalación asistida',
      imagen_url: '',
    },
    {
      id: 4,
      nombre: 'Xiaomi 14 Ultra',
      categoria: 'Celular',
      precio: 3999,
      stock: 2,
      compatible_starlink: false,
      oferta: 'Precio regular',
      imagen_url: '',
    },
    {
      id: 5,
      nombre: 'Router Mesh Starlink',
      categoria: 'Accesorios',
      precio: 450,
      stock: 12,
      compatible_starlink: true,
      oferta: 'Combo con antena',
      imagen_url: '',
    },
  ]);

  await db.insert(Comprobantes).values([
    {
      id: 1001,
      dni_ruc: '45896231',
      nombre_cliente: 'Juan Pérez',
      producto_id: 1,
      vendedor_id: 1,
      cantidad: 1,
      precio_unitario: 4899,
      fecha: new Date('2026-11-01T12:00:00-05:00'),
      estado: 'Emitido',
    },
    {
      id: 1002,
      dni_ruc: '20601234567',
      nombre_cliente: 'Inversiones Tambopata',
      producto_id: 3,
      vendedor_id: 1,
      cantidad: 1,
      precio_unitario: 1899,
      fecha: new Date('2026-11-03T12:00:00-05:00'),
      estado: 'Pendiente',
    },
    {
      id: 1003,
      dni_ruc: '71234567',
      nombre_cliente: 'María Torres',
      producto_id: 5,
      vendedor_id: 3,
      cantidad: 1,
      precio_unitario: 450,
      fecha: new Date('2026-11-04T12:00:00-05:00'),
      estado: 'Emitido',
    },
  ]);
}
