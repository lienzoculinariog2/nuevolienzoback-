const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testStripeWebhook() {
  console.log('🧪 ===== PROBANDO WEBHOOK CON STRIPE CLI =====');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('');
  
  console.log('📋 INSTRUCCIONES:');
  console.log('');
  console.log('1️⃣ Asegúrate de que el servidor esté ejecutándose:');
  console.log('   npm run start:dev');
  console.log('');
  console.log('2️⃣ En otra terminal, ejecuta el listener de Stripe:');
  console.log('   stripe listen --forward-to localhost:3001/payments/webhook');
  console.log('');
  console.log('3️⃣ En una tercera terminal, ejecuta este comando para simular un pago exitoso:');
  console.log('   stripe trigger payment_intent.succeeded');
  console.log('');
  console.log('4️⃣ O si tienes un payment intent específico:');
  console.log('   stripe trigger payment_intent.succeeded --payment-intent=pi_XXXXX');
  console.log('');
  console.log('🔍 Verifica los logs del servidor para ver si el webhook se procesa correctamente.');
  console.log('');
  
  // Verificar que el servidor esté funcionando
  try {
    const response = await axios.get(`${BASE_URL}/products`);
    console.log('✅ Servidor funcionando correctamente');
    console.log(`📦 Productos disponibles: ${response.data.data?.length || response.data.length}`);
  } catch (error) {
    console.log('❌ Servidor no responde:', error.message);
  }
  
  console.log('');
  console.log('🎯 Cuando ejecutes el webhook, deberías ver en los logs del servidor:');
  console.log('   - "🔔 ===== WEBHOOK RECIBIDO ====="');
  console.log('   - "🔍 ===== PROCESANDO PAYMENT INTENT: payment_intent.succeeded ====="');
  console.log('   - "🔍 ===== MANEJANDO PAGO EXITOSO ====="');
  console.log('   - "📦 ===== ACTUALIZANDO STOCK DE PRODUCTOS ====="');
  console.log('   - "🛒 ===== LIMPIANDO CARRITO ====="');
  console.log('');
}

testStripeWebhook().catch(console.error);
