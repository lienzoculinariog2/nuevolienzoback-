export const corsConfig = {
  development: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://localhost:5173', // Vite default
      'http://localhost:8080', // Otros puertos comunes
      'http://localhost:4200', // Angular default
      'http://localhost:3002', // Otros puertos
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'stripe-signature',
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },
  production: {
    origin: [
      // Variable de entorno para el frontend desplegado
      process.env.FRONTEND_URL,

      // URLs de desarrollo (para testing en producción)
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://localhost:5173', // Vite
      'http://localhost:4200', // Angular

      // Patrones para plataformas de despliegue comunes
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.netlify\.app$/,
      /^https:\/\/.*\.onrender\.com$/,
    ].filter((origin): origin is string | RegExp => Boolean(origin)),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'stripe-signature',
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },
};
