# Lienzo Culinario — Backend

API REST del proyecto Lienzo Culinario, construida con NestJS y PostgreSQL. Gestiona catálogo, usuarios, carrito, checkout, órdenes, códigos de descuento, pagos, inventario, reseñas, archivos y notificaciones.

## Estado del proyecto

- Producción desplegada en Render desde `main`.
- Base de datos PostgreSQL alojada en Neon.
- Autenticación y autorización mediante Auth0/JWT.
- Pagos con Stripe Elements y webhook verificado.
- Descuento de inventario transaccional e idempotente.
- CI de GitHub: **Build and test**.
- Tareas cron: actualmente deshabilitadas.

## Inicio rápido

El código de la aplicación vive en [`lienzoback/`](./lienzoback/).

```bash
cd lienzoback
cp .env.example .env.development
npm ci
npm run start:dev
```

La API local utiliza `http://localhost:3001` y Swagger queda disponible en `http://localhost:3001/docs`.

## Documentación

La guía técnica completa contiene requisitos, variables de entorno, arquitectura, comandos, flujo de pago, estado de cron, despliegue, seguridad y futura integración con Docker:

**[Abrir documentación del backend](./lienzoback/README.md)**

Documentos históricos o especializados que permanecen en el repositorio:

- [`docs/`](./docs/) — análisis y documentación complementaria.
- [`lienzoback/README-SETUP.md`](./lienzoback/README-SETUP.md) — notas de configuración anteriores.
- [`lienzoback/README-DEBUGGING.md`](./lienzoback/README-DEBUGGING.md) — diagnóstico histórico.
- [`lienzoback/README-PRICES.md`](./lienzoback/README-PRICES.md) — notas de precios.

La fuente vigente para operar el proyecto es [`lienzoback/README.md`](./lienzoback/README.md).

## Frontend

Repositorio relacionado: [lienzoculinariog2/lienzofront](https://github.com/lienzoculinariog2/lienzofront)

## Seguridad

No confirmes credenciales ni archivos `.env` reales. Si una clave fue publicada alguna vez, elimínala del proveedor y genera una nueva; borrarla de un commit posterior no la revoca.
