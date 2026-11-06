export type NivelStock = 'Agotado' | 'Bajo' | 'OK';

const formatoSoles = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

const formatoFecha = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatearSoles(monto: number): string {
  return formatoSoles.format(monto);
}

export function formatearFecha(fecha: Date): string {
  return formatoFecha.format(fecha);
}

export function codigoProducto(id: number): string {
  return `PROD-${String(id).padStart(3, '0')}`;
}

export function codigoComprobante(id: number): string {
  return `VTA-${id}`;
}

export function calcularMonto(precioUnitario: number, cantidad: number): number {
  return Number((precioUnitario * cantidad).toFixed(2));
}

export function calcularNivelStock(stock: number): NivelStock {
  if (stock <= 0) {
    return 'Agotado';
  }
  if (stock <= 2) {
    return 'Bajo';
  }
  return 'OK';
}

export function claseBadgeStock(nivel: NivelStock): string {
  if (nivel === 'Agotado') {
    return 'bg-red-100 text-red-800 border-red-200';
  }
  if (nivel === 'Bajo') {
    return 'bg-amber-100 text-amber-800 border-amber-200';
  }
  return 'bg-emerald-100 text-emerald-800 border-emerald-200';
}

export function claseBadgeEstado(estado: string): string {
  if (estado === 'Emitido') {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
  if (estado === 'Anulado') {
    return 'bg-red-100 text-red-800 border-red-200';
  }
  return 'bg-amber-100 text-amber-800 border-amber-200';
}
