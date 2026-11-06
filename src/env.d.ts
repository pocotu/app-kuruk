/// <reference path="../.astro/types.d.ts" />
import type { AvisoFlash, Usuario } from './lib/api';

declare global {
  namespace App {
    interface Locals {
      user: Usuario | null;
      aviso?: AvisoFlash | null;
    }
  }
}
