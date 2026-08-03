# Lienzo Culinario — Backend

API REST de Lienzo Culinario. Gestiona usuarios, catálogo, carrito, checkout, órdenes, descuentos, reseñas, archivos, notificaciones y pagos con Stripe.

## Stack

- Node.js 24 y NestJS 11
- PostgreSQL con TypeORM
- Auth0 mediante JWT y JWKS
- Stripe Payment Intents y webhooks
- Cloudinary para imágenes
- Nodemailer y Handlebars para correo
- Swagger en `/docs`

## Requisitos

- Node.js 24
- npm
- PostgreSQL local o una base compatible, como Neon
- Credenciales de Auth0, Stripe y Cloudinary para probar esas integraciones

## Configuración local

```bash
git clone https://github.com/lienzoculinariog2/nuevolienzoback-.git
cd nuevolienzoback-/lienzoback
cp .env.example .env.development
npm ci
npm run start:dev
```

La API queda disponible en `http://localhost:3001` y Swagger en `http://localhost:3001/docs`.

Nunca confirmes archivos `.env*` con valores reales. Usa `.env.example` únicamente como catálogo de variables.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `NODE_ENV` | Entorno de ejecución (`development`, `test` o `production`) |
| `PORT` | Puerto HTTP; Render lo proporciona automáticamente |
| `DATABASE_URL` | Conexión PostgreSQL de producción, por ejemplo Neon |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | Conexión PostgreSQL local |
| `TYPEORM_SYNC`, `TYPEORM_DROP` | Opciones de esquema; deben permanecer en `false` en producción |
| `FRONTEND_URL` | Origen principal permitido por CORS |
| `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` | Validación de access tokens de Auth0 |
| `STRIPE_SECRET_KEY` | Clave privada de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Firma del endpoint `/payments/webhook` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Carga de imágenes |
| `NODEMAILER_HOST`, `NODEMAILER_PORT`, `NODEMAILER_SECURE` | Transporte SMTP |
| `EMAIL_USER`, `EMAIL_PASSWORD` | Cuenta SMTP |

## Comandos

```bash
npm run start:dev       # desarrollo con recarga
npm run build           # compilación de producción
npm run start:prod      # compila e inicia dist/main
npm test -- --runInBand # pruebas
npm run lint            # lint del proyecto
```

## Módulos principales

```text
src/
├── bootstrap/       # migraciones y datos iniciales
├── config/          # TypeORM, CORS y servicios externos
└── modules/
    ├── auth/        # autenticación Auth0/JWT
    ├── users/       # usuarios y roles
    ├── products/    # catálogo e inventario
    ├── categories/  # categorías
    ├── ingredients/ # ingredientes
    ├── cart/        # carrito por usuario
    ├── checkout/    # creación de orden y Payment Intent
    ├── orders/      # ciclo de vida de órdenes
    ├── payments/    # Stripe y webhook idempotente
    ├── discount-codes/
    ├── product-review/
    ├── file-upload/
    └── notifications/
```

## Flujo de pago

1. El usuario autenticado completa el checkout.
2. El backend calcula importes y descuentos; no confía en totales enviados por el cliente.
3. Stripe confirma el pago mediante `POST /payments/webhook`.
4. El backend verifica la firma usando el cuerpo crudo de la solicitud.
5. En una transacción idempotente marca la orden como pagada, descuenta stock una sola vez y registra el uso del cupón.

El webhook es la fuente de verdad. No se debe descontar inventario desde el frontend ni desde un cambio manual de estado.

## Tareas programadas (cron)

Actualmente **no hay cron jobs activos**.

`NotificationsModule` inicializa `ScheduleModule`, y `NotificationsService` conserva el método `handleWeeklyNewsletter`, pero su decorador `@Cron` está comentado. El endpoint manual de prueba también está comentado. Por tanto, Render no ejecuta newsletters programados en el estado actual del repositorio.

Antes de habilitarlo se debe definir explícitamente:

- horario y zona horaria;
- consentimiento y baja de suscriptores;
- límites y reintentos del proveedor SMTP;
- protección contra ejecuciones duplicadas cuando existan varias instancias;
- métricas y registro de entregas.

Para producción es preferible un único worker o un servicio Cron de Render que invoque una operación interna protegida, en vez de ejecutar el mismo cron dentro de cada réplica web.

## Despliegue

La rama de producción es `main`. Render construye el backend y utiliza Neon PostgreSQL. Configura las variables anteriores en el panel del servicio, nunca en GitHub.

Después de un despliegue relacionado con pagos, verifica:

- servicio en estado **Live**;
- respuesta de `/docs`;
- webhook de Stripe con HTTP 2xx;
- orden pagada, stock descontado una vez y cupón registrado.

## Docker

El proyecto todavía no incluye `Dockerfile`. La arquitectura permite incorporarlo posteriormente; se recomienda una imagen multi-stage con Node 24, ejecución como usuario no privilegiado y variables inyectadas en tiempo de ejecución.

## Seguridad

- Rota inmediatamente cualquier credencial que haya sido publicada o compartida.
- Mantén `TYPEORM_SYNC=false` y `TYPEORM_DROP=false` en producción.
- No registres tokens, firmas de Stripe, contraseñas ni cuerpos completos de webhooks.
- Todo cambio debe pasar por PR y por el workflow **Build and test**.
