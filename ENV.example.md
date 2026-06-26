# Variables de entorno — Club Deportivo

## No commitear

- `backend/.env`
- `frontend/.env.local`

Usa este archivo solo como plantilla. En producción configura las variables en el servidor.

## Backend (`backend/.env`)

```
DATABASE_URL=postgresql://usuario:password@host:5432/nombre_bd
JWT_SECRET=genera_un_secreto_largo_y_aleatorio
PORT=3001
CORS_ORIGIN=https://clubelcanito.tryviax.com
```

## Frontend (`frontend/.env.local` en dev)

**En producción configurar en el hosting ANTES de `npm run build`:**

```
NEXT_PUBLIC_API_URL=https://api.tryviax.com
NEXTAUTH_SECRET=secreto_largo_aleatorio
NEXTAUTH_URL=https://clubelcanito.tryviax.com
```

Ver también [DEPLOY.md](./DEPLOY.md).
