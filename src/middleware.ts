import { defineMiddleware } from 'astro:middleware';
import { validarSesion } from './lib/auth';

export const onRequest = defineMiddleware(async function (context, next) {
  const { pathname } = context.url;

  if (pathname.startsWith('/_astro')) {
    return next();
  }

  const usuario = await validarSesion(context.cookies);
  context.locals.user = usuario;

  if (pathname.startsWith('/_actions')) {
    return next();
  }

  if (pathname === '/login') {
    if (usuario) {
      return context.redirect('/');
    }
    return next();
  }

  if (!usuario) {
    return context.redirect('/login');
  }

  if (pathname.startsWith('/gestion') && usuario.rol !== 'Administrador') {
    return context.redirect('/?error=acceso_denegado');
  }

  return next();
});
