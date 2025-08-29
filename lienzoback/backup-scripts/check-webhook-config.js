const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';

// Colores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  log('🔍 ===== VERIFICANDO CONFIGURACIÓN DE WEBHOOKS =====', 'cyan');
  log('Revisando archivo .env.development...\n', 'white');

  const envPath = path.join(__dirname, '.env.development');
  
  if (!fs.existsSync(envPath)) {
    log('❌ Archivo .env.development no encontrado', 'red');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Verificar variables de Stripe
  const stripeSecretKey = envContent.match(/STRIPE_SECRET_KEY=(.+)/);
  const stripeWebhookSecret = envContent.match(/STRIPE_WEBHOOK_SECRET=(.+)/);
  
  log('📋 Variables de Stripe encontradas:', 'blue');
  
  if (stripeSecretKey) {
    const key = stripeSecretKey[1];
    if (key.startsWith('sk_test_')) {
      log('✅ STRIPE_SECRET_KEY: Configurado (test mode)', 'green');
    } else if (key.startsWith('sk_live_')) {
      log('⚠️ STRIPE_SECRET_KEY: Configurado (LIVE mode - ¡CUIDADO!)', 'yellow');
    } else {
      log('❌ STRIPE_SECRET_KEY: Formato inválido', 'red');
    }
  } else {
    log('❌ STRIPE_SECRET_KEY: No encontrado', 'red');
  }
  
  if (stripeWebhookSecret) {
    const secret = stripeWebhookSecret[1];
    if (secret.startsWith('whsec_')) {
      log('✅ STRIPE_WEBHOOK_SECRET: Configurado', 'green');
    } else {
      log('❌ STRIPE_WEBHOOK_SECRET: Formato inválido', 'red');
    }
  } else {
    log('❌ STRIPE_WEBHOOK_SECRET: No encontrado', 'red');
    log('💡 Necesitas configurar esta variable para webhooks locales', 'yellow');
  }

  return true;
}

async function checkServerStatus() {
  log('\n🌐 Verificando estado del servidor...', 'blue');
  
  try {
    const response = await axios.get(`${BASE_URL}/products`);
    log('✅ Servidor funcionando correctamente', 'green');
    return true;
  } catch (error) {
    log('❌ Servidor no responde', 'red');
    log('💡 Asegúrate de que el servidor esté ejecutándose con: npm run start:dev', 'yellow');
    return false;
  }
}

async function checkWebhookEndpoint() {
  log('\n🔔 Verificando endpoint de webhook...', 'blue');
  
  try {
    // Enviar una petición de prueba al webhook
    const response = await axios.post(`${BASE_URL}/payments/webhook`, 
      { test: 'data' },
      {
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'test_signature'
        }
      }
    );
    log('✅ Endpoint de webhook responde', 'green');
    return true;
  } catch (error) {
    if (error.response?.status === 400) {
      log('✅ Endpoint de webhook responde (error esperado por firma inválida)', 'green');
      return true;
    } else {
      log('❌ Endpoint de webhook no responde correctamente', 'red');
      log(`📄 Error: ${error.message}`, 'yellow');
      return false;
    }
  }
}

async function checkStripeCLI() {
  log('\n🛠️ Verificando Stripe CLI...', 'blue');
  
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    exec('stripe --version', (error, stdout, stderr) => {
      if (error) {
        log('❌ Stripe CLI no está instalado', 'red');
        log('💡 Instala Stripe CLI:', 'yellow');
        log('   macOS: brew install stripe/stripe-cli/stripe', 'white');
        log('   Windows: choco install stripe-cli', 'white');
        log('   Linux: Descarga desde https://github.com/stripe/stripe-cli/releases', 'white');
        resolve(false);
      } else {
        log(`✅ Stripe CLI instalado: ${stdout.trim()}`, 'green');
        resolve(true);
      }
    });
  });
}

async function checkNgrok() {
  log('\n🌐 Verificando ngrok...', 'blue');
  
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    exec('ngrok version', (error, stdout, stderr) => {
      if (error) {
        log('❌ ngrok no está instalado', 'red');
        log('💡 Instala ngrok:', 'yellow');
        log('   npm install -g ngrok', 'white');
        log('   O descarga desde: https://ngrok.com/download', 'white');
        resolve(false);
      } else {
        log(`✅ ngrok instalado: ${stdout.trim()}`, 'green');
        resolve(true);
      }
    });
  });
}

async function checkOrdersAndPayments() {
  log('\n📋 Verificando órdenes y pagos...', 'blue');
  
  try {
    // Verificar órdenes
    const ordersResponse = await axios.get(`${BASE_URL}/orders`);
    const orders = ordersResponse.data;
    log(`📊 Total de órdenes: ${orders.length}`, 'white');
    
    const pendingOrders = orders.filter(order => order.statusOrder === 'pending');
    log(`📊 Órdenes pendientes: ${pendingOrders.length}`, 'white');
    
    if (pendingOrders.length > 0) {
      log('⚠️ Hay órdenes pendientes que podrían necesitar webhooks', 'yellow');
      pendingOrders.forEach(order => {
        log(`   - Orden ID: ${order.id}, Usuario: ${order.userId}, Total: $${order.totalAmount}`, 'yellow');
      });
    }
    
    return true;
  } catch (error) {
    log('❌ Error obteniendo órdenes', 'red');
    return false;
  }
}

function showNextSteps() {
  log('\n🚀 ===== PRÓXIMOS PASOS =====', 'cyan');
  log('Para configurar webhooks en desarrollo local:', 'white');
  log('', 'white');
  log('1. 🔧 Configurar Stripe CLI:', 'blue');
  log('   stripe login', 'white');
  log('   stripe listen --forward-to localhost:3001/payments/webhook', 'white');
  log('', 'white');
  log('2. 🔧 Agregar webhook secret a .env.development:', 'blue');
  log('   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx', 'white');
  log('', 'white');
  log('3. 🧪 Probar webhook:', 'blue');
  log('   stripe trigger payment_intent.succeeded', 'white');
  log('', 'white');
  log('4. 📊 Verificar resultados:', 'blue');
  log('   npm run debug:checkout', 'white');
  log('   npm run test:webhook', 'white');
  log('', 'white');
  log('5. 🔍 Monitorear logs del servidor', 'blue');
  log('   Buscar: "🔔 ===== WEBHOOK RECIBIDO ====="', 'white');
}

async function main() {
  log('🔍 ===== VERIFICACIÓN DE CONFIGURACIÓN DE WEBHOOKS =====', 'cyan');
  log('Analizando configuración actual...\n', 'white');

  // Verificar archivo .env
  const envOk = checkEnvFile();
  
  // Verificar servidor
  const serverOk = await checkServerStatus();
  
  if (serverOk) {
    // Verificar endpoint de webhook
    await checkWebhookEndpoint();
    
    // Verificar órdenes y pagos
    await checkOrdersAndPayments();
  }
  
  // Verificar herramientas
  await checkStripeCLI();
  await checkNgrok();
  
  // Mostrar próximos pasos
  showNextSteps();
  
  log('\n📝 ===== RESUMEN =====', 'cyan');
  if (envOk && serverOk) {
    log('✅ Configuración básica correcta', 'green');
    log('💡 Sigue los próximos pasos para configurar webhooks', 'yellow');
  } else {
    log('❌ Hay problemas en la configuración', 'red');
    log('💡 Revisa los errores arriba y corrígelos', 'yellow');
  }
}

// Ejecutar verificación
main().catch(console.error);
