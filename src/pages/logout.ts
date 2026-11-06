import type { APIRoute } from 'astro';
import { api, borrarSesion } from '../lib/api';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  await api(cookies, 'POST', '/auth/logout');
  borrarSesion(cookies);
  return redirect('/login');
};
