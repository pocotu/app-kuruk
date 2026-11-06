# app-kuruk — Frontend

Pantallas de KURUK (Astro SSR + Tailwind). No tiene base de datos: todos los datos salen de **api-kuruk**.

## Cómo funciona
- `src/lib/api.ts`: cliente de la API. Envía el token de sesión (cookie `httpOnly`) como `Authorization: Bearer`. El navegador nunca llama directo a la API.
- `src/middleware.ts`: carga el usuario con `GET /auth/me`, envía a `/login` a quien no tiene sesión y bloquea `/gestion` a quien no es Administrador.
- Cada página procesa su propio formulario (`POST` a la misma URL) y muestra los errores que devuelve la API junto a cada campo.

## Uso en local
```sh
pnpm install
cp .env.example .env      # API_URL=http://localhost:3001
pnpm dev                  # http://localhost:4321 (api-kuruk debe estar corriendo)
```

## Comandos
| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm astro check` | Revisión de tipos |
| `pnpm build` | Build para Vercel |

## Variables de entorno
| Variable | Ejemplo |
|---|---|
| `API_URL` | `https://api-kuruk.vercel.app` |
