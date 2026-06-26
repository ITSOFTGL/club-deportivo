# Despliegue sin romper producción

## No subir archivos de entorno al repositorio

Estos archivos **no deben** ir en git (ya están en `.gitignore`):

- `backend/.env`
- `frontend/.env.local`
- Cualquier `.env.production`

En el servidor de producción configura las variables **solo en el panel del hosting** o en `.env` local del servidor (fuera de git).

### Producción actual (referencia — no commitear)

| Servicio | Variable | Ejemplo prod |
|----------|----------|----------------|
| Backend | `DATABASE_URL` | PostgreSQL prod |
| Backend | `JWT_SECRET` | secreto largo |
| Backend | `CORS_ORIGIN` | `https://clubelcanito.tryviax.com` |
| Frontend | `NEXT_PUBLIC_API_URL` | `https://api.tryviax.com` |
| Frontend | `NEXTAUTH_URL` | `https://clubelcanito.tryviax.com` |
| Frontend | `NEXTAUTH_SECRET` | secreto largo |

## Flujo recomendado al subir código

```bash
git add .
git status   # verificar que NO aparezcan .env ni .env.local
git commit -m "..."
git push
```

En el servidor:

```bash
git pull
cd backend && npm install && npm run build
npx prisma migrate deploy
pm2 restart backend   # o su proceso

cd ../frontend && npm install && npm run build
pm2 restart frontend
```

## Cambio importante: API de usuarios

La ruta del API pasó de `/users` a **`/usuarios`** (algunos firewalls bloquean `/users` con 401).

Tras desplegar el frontend, en DevTools → Red debe verse:

`GET https://api.tryviax.com/usuarios` (correcto)

`GET https://api.tryviax.com/users` (build viejo o caché; el axios actual lo reescribe a `/usuarios`)

Si sigue fallando: `Ctrl+Shift+R` en el navegador y reiniciar el proceso del frontend (`npm run build` + reinicio PM2/systemd).

Después del deploy, probar en el navegador (logueado):

`https://api.tryviax.com/usuarios`

Debe responder JSON (lista o 401), no 403 del firewall.

## Migración categorías (obligatoria tras el último deploy)

Si en el navegador ves **500** en `/students`, `/categories`, `/payments`, `/guardians`, etc., pero **usuarios, sucursales y horarios** sí cargan, casi siempre falta aplicar migraciones en PostgreSQL.

El código nuevo usa la columna `categories.groupLabel`. Sin migrar, Prisma falla al leer categorías y todo lo que las incluye devuelve error.

En el servidor (con `DATABASE_URL` de producción):

```bash
cd backend
npm install
npx prisma migrate deploy
npm run build
pm2 restart backend   # o su proceso
```

Comprobar en los logs del backend al arrancar: no debe aparecer `Falta la columna categories.groupLabel`.

Probar (con sesión iniciada):

- `GET https://api.tryviax.com/categories` → JSON, no 500
- `GET https://api.tryviax.com/students` → JSON, no 500

Si `migrate deploy` falla por índice único duplicado, hay categorías repetidas con el mismo nombre en la misma sucursal. La migración `20260530140000_category_group_label` intenta asignar `Grupo 2`, `Grupo 3`, etc. Vuelva a ejecutar `npx prisma migrate deploy` tras actualizar el código.

Permite además crear "Sub 10" en cada sucursal y dos grupos (Grupo A / Grupo B) en la misma sucursal.

## `migrate status` OK pero falta `categories.groupLabel`

A veces la tabla `_prisma_migrations` marca la migración como hecha y la columna **no se creó** (fallo a medias, restore de BD, etc.). El API responde:

`The column categories.groupLabel does not exist in the current database`

**En el servidor** (ya estás en `/var/www/club-deportivo/backend`, no hagas `cd backend` otra vez):

```bash
cd /var/www/club-deportivo/backend
npx prisma db execute --file prisma/scripts/repair-category-group-label.sql
pm2 restart backend
```

Alternativa con `psql`:

```bash
psql "$DATABASE_URL" -f prisma/scripts/repair-category-group-label.sql
```

Comprobar que la columna existe:

```bash
npx prisma db execute --stdin <<'SQL'
SELECT column_name FROM information_schema.columns
WHERE table_name = 'categories' AND column_name = 'groupLabel';
SQL
```

Debe devolver una fila `groupLabel`. Luego probar `GET https://api.tryviax.com/categories`.

## Error 503 con mensaje "Base de datos no está actualizada"

Tras desplegar el backend más reciente, si el API responde **503** con `DATABASE_SCHEMA_OUTDATED`, ejecute `npx prisma migrate deploy` como arriba.

## Favicon 404

`GET /favicon.png` en el dominio del club es solo cosmético; no afecta al API. Puede añadir `frontend/public/favicon.ico` o corregir `metadata` en `app/layout.tsx`.
