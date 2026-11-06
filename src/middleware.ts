import { defineMiddleware } from 'astro:middleware';
import { api, avisar, borrarSesion, tieneSesion, tomarAviso, type Usuario } from './lib/api';

const RUTAS_PUBLICAS = new Set(['/logout', '/inicio', '/_image']);

export const onRequest = defineMiddleware(async function (context, next) {
  // Sin barra final: al prerenderizar, Astro pide `/inicio/`.
  const pathname = context.url.pathname.replace(/(.)\/$/, '$1');

  // Rutas que no dependen del usuario: cerrar sesión, la landing (estática) y el optimizador de imágenes de Astro.
  if (RUTAS_PUBLICAS.has(pathname)) {
    return next();
  }

  let usuario: Usuario | null = null;
  if (tieneSesion(context.cookies)) {
    const r = await api<Usuario>(context.cookies, 'GET', '/auth/me');
    if (r.ok) {
      usuario = r.data;
    } else if (r.status === 401) {
      borrarSesion(context.cookies);
    }
  }
  context.locals.user = usuario;

  if (pathname === '/login') {
    return usuario ? context.redirect('/') : next();
  }

  if (!usuario) {
    return context.redirect(pathname === '/' ? '/inicio' : '/login');
  }

  if (pathname.startsWith('/gestion') && usuario.rol !== 'Administrador') {
    avisar(context.cookies, 'Solo el Administrador puede entrar a Gestión.', 'aviso');
    return context.redirect('/');
  }

  context.locals.aviso = tomarAviso(context.cookies);
  return next();
});
