#!/usr/bin/env node

/**
 * 🚀 Script para actualizar configuración de Render
 * 
 * Este script te ayuda a actualizar las variables de entorno en Render
 * para usar Neon Database
 * 
 * Uso:
 * node update-render-config.js
 */

const readline = require('readline');

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function updateRenderConfig() {
  console.log('🌟 ===== ACTUALIZACIÓN DE CONFIGURACIÓN DE RENDER =====');
  console.log('');
  
  console.log('📋 Pasos para actualizar Render con Neon:');
  console.log('');
  
  console.log('1️⃣  Ve a tu proyecto en Render:');
  console.log('   https://dashboard.render.com');
  console.log('');
  
  console.log('2️⃣  Navega a tu servicio backend');
  console.log('');
  
  console.log('3️⃣  Ve a la sección "Environment"');
  console.log('');
  
  console.log('4️⃣  Actualiza las siguientes variables:');
  console.log('');
  
  console.log('   ✅ AGREGAR/ACTUALIZAR:');
  console.log('   DATABASE_URL = postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require');
  console.log('');
  
  console.log('   ❌ ELIMINAR (ya no son necesarias):');
  console.log('   DB_HOST');
  console.log('   DB_PORT');
  console.log('   DB_USERNAME');
  console.log('   DB_PASSWORD');
  console.log('   DB_NAME');
  console.log('');
  
  console.log('5️⃣  Guarda los cambios');
  console.log('');
  
  console.log('6️⃣  Redespliega la aplicación');
  console.log('');
  
  const neonUrl = await askQuestion('¿Tienes la URL de conexión de Neon? (y/N): ');
  
  if (neonUrl.toLowerCase() === 'y' || neonUrl.toLowerCase() === 'yes') {
    const url = await askQuestion('Pega la URL de Neon aquí: ');
    
    if (url && url.includes('neon.tech')) {
      console.log('');
      console.log('✅ URL de Neon válida detectada');
      console.log('');
      console.log('📋 Copia esta variable a Render:');
      console.log('');
      console.log(`DATABASE_URL = ${url}`);
      console.log('');
    } else {
      console.log('⚠️ La URL no parece ser de Neon. Verifica que sea correcta.');
    }
  }
  
  console.log('🔧 Variables de entorno recomendadas para Render:');
  console.log('');
  console.log('DATABASE_URL = [tu_url_de_neon]');
  console.log('JWT_SECRET = [tu_jwt_secret]');
  console.log('STRIPE_SECRET_KEY = [tu_stripe_secret_key]');
  console.log('STRIPE_PUBLISHABLE_KEY = [tu_stripe_publishable_key]');
  console.log('STRIPE_WEBHOOK_SECRET = [tu_stripe_webhook_secret]');
  console.log('CLOUDINARY_CLOUD_NAME = [tu_cloudinary_cloud_name]');
  console.log('CLOUDINARY_API_KEY = [tu_cloudinary_api_key]');
  console.log('CLOUDINARY_API_SECRET = [tu_cloudinary_api_secret]');
  console.log('NODE_ENV = production');
  console.log('TYPEORM_SYNC = false');
  console.log('TYPEORM_DROP = false');
  console.log('');
  
  console.log('📋 Después de actualizar Render:');
  console.log('');
  console.log('1. Redespliega la aplicación');
  console.log('2. Verifica los logs de despliegue');
  console.log('3. Prueba la aplicación');
  console.log('4. Verifica que las migraciones se ejecuten');
  console.log('');
  
  console.log('🧪 Comandos para verificar:');
  console.log('');
  console.log('npm run test:neon          # Probar conexión local');
  console.log('npm run migration:run      # Ejecutar migraciones');
  console.log('npm run start:dev          # Probar localmente');
  console.log('');
  
  console.log('✅ Configuración de Render actualizada!');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  updateRenderConfig().catch(console.error);
}

module.exports = { updateRenderConfig };
