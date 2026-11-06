import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';
import { db, eq, Sesiones, Usuarios } from 'astro:db';

const SESSION_COOKIE = 'kuruk_session';
const SESSION_DAYS = 7;

export interface UsuarioSesion {
  id: number;
  email: string;
  nombre: string;
  rol: 'Vendedor' | 'Administrador';
  telefono: string;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) {
    return false;
  }
  const [salt, key] = parts;
  if (!salt || !key) {
    return false;
  }
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = scryptSync(password, salt, 64);
  if (keyBuffer.length !== derivedKey.length) {
    return false;
  }
  return timingSafeEqual(keyBuffer, derivedKey);
}

export async function crearSesion(usuarioId: number, cookies: AstroCookies): Promise<string> {
  const token = randomUUID();
  const expira = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(Sesiones).values({
    token,
    usuario_id: usuarioId,
    expira,
  });

  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    expires: expira,
  });

  return token;
}

export async function validarSesion(cookies: AstroCookies): Promise<UsuarioSesion | null> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const filas = await db
    .select({
      sesion: Sesiones,
      usuario: Usuarios,
    })
    .from(Sesiones)
    .innerJoin(Usuarios, eq(Sesiones.usuario_id, Usuarios.id))
    .where(eq(Sesiones.token, token));

  const registro = filas[0];
  if (!registro) {
    return null;
  }

  if (registro.sesion.expira.getTime() <= Date.now()) {
    await db.delete(Sesiones).where(eq(Sesiones.token, token));
    cookies.delete(SESSION_COOKIE, { path: '/' });
    return null;
  }

  const u = registro.usuario;
  return {
    id: u.id,
    email: u.email,
    nombre: u.nombre,
    rol: u.rol === 'Administrador' ? 'Administrador' : 'Vendedor',
    telefono: u.telefono,
  };
}

export async function cerrarSesion(cookies: AstroCookies): Promise<void> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(Sesiones).where(eq(Sesiones.token, token));
  }
  cookies.delete(SESSION_COOKIE, { path: '/' });
}
