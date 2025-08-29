const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const ORDER_ID = '230b954f-05e8-4f0b-84b4-eb956fcbbe68';
const PAYMENT_INTENT_ID = 'pi_3S0qcqLWWaXlaJCi1EiaJcrk';

async function checkPaymentStatus() {
  console.log('🔍 ===== VERIFICANDO ESTADO DEL PAGO =====');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`📋 Order ID: ${ORDER_ID}`);
  console.log(`💳 Payment Intent ID: ${PAYMENT_INTENT_ID}`);
  console.log('');

  try {
    // 1. Verificar estado de la orden
    console.log('1️⃣ Verificando estado de la orden...');
    const orderStatusResponse = await axios.get(`${BASE_URL}/payments/order-status/${ORDER_ID}`);
    console.log('📊 Estado de la orden:', JSON.stringify(orderStatusResponse.data, null, 2));
    console.log('');

    // 2. Verificar stock del producto
    console.log('2️⃣ Verificando stock del producto...');
    const productResponse = await axios.get(`${BASE_URL}/products/eac0b9b5-3ef9-4aa7-9a33-d61184f7527b`);
    console.log(`📦 Stock actual: ${productResponse.data.stock}`);
    console.log('');

    // 3. Verificar carrito del usuario
    console.log('3️⃣ Verificando carrito del usuario...');
    const cartResponse = await axios.get(`${BASE_URL}/cart/test-user-1755886581310`);
    console.log(`🛒 Items en carrito: ${cartResponse.data.items?.length || 0}`);
    if (cartResponse.data.items?.length > 0) {
      console.log('📋 Items:', cartResponse.data.items.map(item => `${item.name} (${item.quantity})`));
    }
    console.log('');

    // 4. Verificar logs del servidor (simulado)
    console.log('4️⃣ Verificando logs del servidor...');
    console.log('🔍 Busca en los logs del servidor:');
    console.log('   - "🔔 ===== WEBHOOK RECIBIDO ====="');
    console.log('   - "🔍 ===== PROCESANDO PAYMENT INTENT: payment_intent.succeeded ====="');
    console.log('   - "🔍 ===== MANEJANDO PAGO EXITOSO ====="');
    console.log('   - "📦 ===== ACTUALIZANDO STOCK DE PRODUCTOS ====="');
    console.log('   - "🛒 ===== LIMPIANDO CARRITO ====="');
    console.log('');

    console.log('✅ ===== VERIFICACIÓN COMPLETADA =====');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkPaymentStatus().catch(console.error);
