import type { AstroCookies } from 'astro';
import { API_URL } from 'astro:env/server';

// Tipos de las respuestas de api-kuruk (ver docs-kuruk/09-api.md).
type Rol = 'Vendedor' | 'Administrador';
type NivelStock = 'Agotado' | 'Bajo' | 'OK';
type Estado = 'Pendiente' | 'Emitido' | 'Anulado';

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
}

export interface Producto {
  id: number;
  nombre: string;
  categoria: 'Celular' | 'Accesorios' | 'Conectividad';
  precio: number;
  stock: number;
  compatible_starlink: boolean;
  oferta: string | null;
  nivel_stock: NivelStock;
}

export interface Comprobante {
  id: number;
  dni_ruc: string;
  nombre_cliente: string;
  cantidad: number;
  precio_unitario: number;
  monto: number;
  fecha: string;
  estado: Estado;
  producto: Producto;
  vendedor: Pick<Usuario, 'id' | 'nombre' | 'email'>;
}

export interface ComprobanteDetalle extends Comprobante {
  puede_editar: boolean;
  puede_emitir: boolean;
  puede_anular: boolean;
}

type Respuesta<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; campos: Record<string, string>; general: string | null };

export interface AvisoFlash {
  tipo: 'exito' | 'aviso';
  texto: string;
}

const COOKIE_SESION = 'kuruk_session';
const COOKIE_AVISO = 'kuruk_aviso';
const DIAS_SESION = 7;
const LIMITE_MS = 8000;

/** Llama a la API desde el servidor de Astro, enviando el token de la cookie de sesión. */
export async function api<T>(
  cookies: AstroCookies,
  metodo: 'GET' | 'POST' | 'PATCH',
  ruta: string,
  cuerpo?: unknown,
): Promise<Respuesta<T>> {
  const token = cookies.get(COOKIE_SESION)?.value;
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (cuerpo !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(LIMITE_MS),
    });
  } catch {
    return {
      ok: false,
      status: 503,
      campos: {},
      general: `No se pudo conectar con la API (${API_URL}). Verifica que api-kuruk esté encendida.`,
    };
  }
  const json = res.status === 204 ? null : await res.json().catch(() => null);

  if (res.ok) {
    return { ok: true, data: json as T };
  }
  const campos: Record<string, string> = json?.campos ?? {};
  const hayCampos = Object.keys(campos).length > 0;
  return {
    ok: false,
    status: res.status,
    campos,
    general: hayCampos ? null : (json?.error ?? 'No se pudo completar la operación.'),
  };
}

/** Lectura para páginas: devuelve null si no existe (404) y falla ante cualquier otro error. */
export async function leer<T>(cookies: AstroCookies, ruta: string): Promise<T | null> {
  const r = await api<T>(cookies, 'GET', ruta);
  if (r.ok) {
    return r.data;
  }
  if (r.status === 404) {
    return null;
  }
  throw new Error(`API ${ruta}: ${r.status} ${r.general ?? ''}`);
}

export function tieneSesion(cookies: AstroCookies): boolean {
  return cookies.has(COOKIE_SESION);
}

export function guardarSesion(cookies: AstroCookies, token: string): void {
  cookies.set(COOKIE_SESION, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: DIAS_SESION * 24 * 60 * 60,
  });
}

export function borrarSesion(cookies: AstroCookies): void {
  cookies.delete(COOKIE_SESION, { path: '/' });
}

/** Mensaje de un solo uso para la próxima página (tras un redirect); lo recoge el middleware. */
export function avisar(cookies: AstroCookies, texto: string, tipo: AvisoFlash['tipo'] = 'exito'): void {
  cookies.set(COOKIE_AVISO, { tipo, texto }, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 });
}

export function tomarAviso(cookies: AstroCookies): AvisoFlash | null {
  const cookie = cookies.get(COOKIE_AVISO);
  if (!cookie) {
    return null;
  }
  cookies.delete(COOKIE_AVISO, { path: '/' });
  return cookie.json() as AvisoFlash;
}

/** Convierte el formulario enviado en un objeto de texto para mandarlo a la API. */
export async function leerFormulario(request: Request): Promise<Record<string, string>> {
  const datos: Record<string, string> = {};
  for (const [clave, valor] of await request.formData()) {
    if (typeof valor === 'string') {
      datos[clave] = valor;
    }
  }
  return datos;
}

/** Cuerpo para crear o editar un producto: el checkbox solo viaja si está marcado. */
export function cuerpoProducto(form: Record<string, string>) {
  return { ...form, compatible_starlink: 'compatible_starlink' in form };
}
