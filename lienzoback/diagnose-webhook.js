const crypto = require('crypto');
require('dotenv').config({ path: '.env.development' });

console.log('🔍 DIAGNÓSTICO DE WEBHOOK - Lienzo Culinario');
console.log('=============================================\n');

// 1. Verificar configuración de variables de entorno
console.log('1. 📋 VERIFICACIÓN DE VARIABLES DE ENTORNO');
console.log('-------------------------------------------');

const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY', 
  'STRIPE_WEBHOOK_SECRET'
];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NO CONFIGURADO`);
  }
});

// 2. Verificar webhook secret
console.log('\n2. 🔐 VERIFICACIÓN DE WEBHOOK SECRET');
console.log('-------------------------------------');

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (webhookSecret) {
  console.log(`✅ Webhook Secret encontrado: ${webhookSecret.substring(0, 20)}...`);
  
  // Verificar formato
  if (webhookSecret.startsWith('whsec_')) {
    console.log('✅ Formato correcto (empieza con whsec_)');
  } else {
    console.log('❌ Formato incorrecto (debe empezar con whsec_)');
  }
} else {
  console.log('❌ STRIPE_WEBHOOK_SECRET no está configurado');
}

// 3. Generar payload de prueba
console.log('\n3. 🧪 PAYLOAD DE PRUEBA');
console.log('------------------------');

const testPayload = {
  id: 'evt_test_diagnosis',
  object: 'event',
  api_version: '2025-07-30.basil',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'pi_test_diagnosis',
      object: 'payment_intent',
      amount: 1000,
      currency: 'usd',
      status: 'succeeded',
      metadata: {
        orderId: 'test-order-diagnosis'
      }
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test_diagnosis',
    idempotency_key: null
  },
  type: 'payment_intent.succeeded'
};

const payloadString = JSON.stringify(testPayload);
const timestamp = Math.floor(Date.now() / 1000);

console.log('Payload generado:', payloadString.substring(0, 100) + '...');

// 4. Generar firma de prueba
console.log('\n4. 🔏 FIRMA DE PRUEBA');
console.log('----------------------');

if (webhookSecret) {
  const signedPayload = `${timestamp}.${payloadString}`;
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  const stripeSignature = `t=${timestamp},v1=${signature}`;
  
  console.log('✅ Firma generada correctamente');
  console.log('Timestamp:', timestamp);
  console.log('Signature:', stripeSignature.substring(0, 50) + '...');
  
  // 5. Comando de prueba
  console.log('\n5. 🚀 COMANDO DE PRUEBA');
  console.log('------------------------');
  console.log('Para probar el webhook, ejecuta:');
  console.log('');
  console.log(`curl -X POST http://localhost:3001/payments/webhook \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "stripe-signature: ${stripeSignature}" \\`);
  console.log(`  -d '${payloadString}'`);
  console.log('');
  
  // 6. Verificar configuración en Stripe Dashboard
  console.log('6. 🌐 CONFIGURACIÓN EN STRIPE DASHBOARD');
  console.log('--------------------------------------');
  console.log('Verifica en https://dashboard.stripe.com/webhooks:');
  console.log('');
  console.log('✅ Endpoint URL configurado correctamente');
  console.log('✅ Eventos seleccionados:');
  console.log('   - payment_intent.succeeded');
  console.log('   - payment_intent.payment_failed');
  console.log('   - payment_intent.canceled');
  console.log('✅ Webhook secret copiado correctamente');
  console.log('✅ Estado del webhook: "Active"');
  console.log('');
  
  // 7. Posibles problemas
  console.log('7. 🚨 POSIBLES PROBLEMAS');
  console.log('------------------------');
  console.log('❌ URL del webhook incorrecta');
  console.log('❌ Webhook secret no coincide');
  console.log('❌ Servidor no está corriendo en puerto 3001');
  console.log('❌ Firewall bloqueando conexiones');
  console.log('❌ CORS configurado incorrectamente');
  console.log('❌ Variables de entorno no cargadas');
  console.log('');
  
  // 8. Soluciones
  console.log('8. 🔧 SOLUCIONES');
  console.log('----------------');
  console.log('1. Verificar que el servidor esté corriendo: npm run start:dev');
  console.log('2. Verificar URL en Stripe Dashboard');
  console.log('3. Verificar webhook secret en .env.development');
  console.log('4. Probar con el comando curl de arriba');
  console.log('5. Revisar logs del servidor para errores');
  console.log('6. Verificar que el endpoint /payments/webhook esté disponible');
  
} else {
  console.log('❌ No se puede generar firma sin webhook secret');
}

console.log('\n🔍 Diagnóstico completado');
