/// <reference path="../.astro/types.d.ts" />
import type { UsuarioSesion } from './lib/auth';

declare global {
  namespace App {
    interface Locals {
      user: UsuarioSesion | null;
    }
  }
}
