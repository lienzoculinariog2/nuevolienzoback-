require('dotenv').config({ path: '.env.development' });

console.log('🔍 VERIFICACIÓN DE CONFIGURACIÓN CORS');
console.log('=====================================\n');

console.log('🌐 Variables de entorno:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'No configurado');
console.log('PORT:', process.env.PORT || '3001');

console.log('\n📋 URLs permitidas en producción:');
const productionOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://localhost:4200',
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.netlify\.app$/,
  /^https:\/\/.*\.onrender\.com$/,
].filter(Boolean);

productionOrigins.forEach((origin, index) => {
  console.log(`   ${index + 1}. ${origin}`);
});

console.log('\n🔧 Headers permitidos:');
const allowedHeaders = [
  'Origin',
  'X-Requested-With',
  'Content-Type',
  'Accept',
  'Authorization',
  'X-API-Key',
  'stripe-signature',
];

allowedHeaders.forEach((header, index) => {
  console.log(`   ${index + 1}. ${header}`);
});

console.log('\n📊 Métodos permitidos:');
const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
allowedMethods.forEach((method, index) => {
  console.log(`   ${index + 1}. ${method}`);
});

console.log('\n🔍 DIAGNÓSTICO:');
console.log('==============');
console.log('Si el frontend no puede conectar:');
console.log('1. Verificar que la URL del frontend esté en la lista de origins permitidos');
console.log('2. Verificar que el método HTTP esté permitido');
console.log('3. Verificar que los headers necesarios estén permitidos');
console.log('4. Verificar que credentials esté configurado correctamente');

console.log('\n🚀 URL del backend:');
console.log('https://nuevolienzoback.onrender.com');

console.log('\n📝 PARA EL FRONTEND:');
console.log('1. Usar la URL correcta del backend');
console.log('2. Incluir los headers necesarios');
console.log('3. Verificar que la URL del frontend esté permitida en CORS');
