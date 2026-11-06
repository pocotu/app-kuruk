import type { Producto } from './api';

const formatoSoles = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

const formatoFecha = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatearSoles(monto: number): string {
  return formatoSoles.format(monto);
}

export function formatearFecha(fechaIso: string): string {
  return formatoFecha.format(new Date(fechaIso));
}

export function codigoProducto(id: number): string {
  return `PROD-${String(id).padStart(3, '0')}`;
}

export function codigoComprobante(id: number): string {
  return `VTA-${id}`;
}

/** Texto y color del punto de stock: se lee sin depender del color. */
export function estadoStock(producto: Pick<Producto, 'stock' | 'nivel_stock'>) {
  if (producto.nivel_stock === 'Agotado') {
    return { texto: 'Agotado', punto: 'bg-red-500', tono: 'text-red-700' };
  }
  if (producto.nivel_stock === 'Bajo') {
    return { texto: `Quedan ${producto.stock}`, punto: 'bg-amber-500', tono: 'text-amber-800' };
  }
  return { texto: `${producto.stock} en stock`, punto: 'bg-emerald-500', tono: 'text-stone-600' };
}

export function claseBadgeEstado(estado: string): string {
  if (estado === 'Emitido') {
    return 'bg-emerald-50 text-emerald-800';
  }
  if (estado === 'Anulado') {
    return 'bg-stone-100 text-stone-600';
  }
  return 'bg-amber-50 text-amber-800';
}
