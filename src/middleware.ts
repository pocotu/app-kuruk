import { defineMiddleware } from 'astro:middleware';
import { api, avisar, borrarSesion, tieneSesion, tomarAviso, type Usuario } from './lib/api';

export const onRequest = defineMiddleware(async function (context, next) {
  const { pathname } = context.url;

  // Cerrar sesión no necesita saber quién es el usuario.
  if (pathname === '/logout') {
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
    return context.redirect('/login');
  }

  if (pathname.startsWith('/gestion') && usuario.rol !== 'Administrador') {
    avisar(context.cookies, 'Solo el Administrador puede entrar a Gestión.', 'aviso');
    return context.redirect('/');
  }

  context.locals.aviso = tomarAviso(context.cookies);
  return next();
});
