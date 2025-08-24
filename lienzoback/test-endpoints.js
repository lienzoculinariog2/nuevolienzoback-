const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Datos de prueba
const testData = {
  userId: '550e8400-e29b-41d4-a716-446655440000', // UUID de ejemplo
  orderId: '550e8400-e29b-41d4-a716-446655440001', // UUID de ejemplo
  checkoutData: {
    shippingAddress: '123 Test Street, Test City',
    discountCode: null
  },
  paymentData: {
    orderId: '550e8400-e29b-41d4-a716-446655440001',
    customerEmail: 'test@example.com',
    description: 'Test payment'
  }
};

async function testEndpoint(method, url, data = null, description) {
  try {
    console.log(`\n🔍 Probando: ${description}`);
    console.log(`   ${method.toUpperCase()} ${url}`);
    
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📄 Response:`, JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.status || error.code}`);
    if (error.response?.data) {
      console.log(`   📄 Error Response:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(`   📄 Error Message: ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🧪 Pruebas de Endpoints - Payments, Checkout y Orders');
  console.log('==================================================\n');
  
  const results = {
    payments: [],
    checkout: [],
    orders: []
  };
  
  // Pruebas de Payments
  console.log('💳 PRUEBAS DE PAYMENTS');
  console.log('=====================');
  
  results.payments.push(await testEndpoint(
    'POST',
    '/payments/create-payment-intent',
    testData.paymentData,
    'Crear Payment Intent'
  ));
  
  results.payments.push(await testEndpoint(
    'GET',
    `/payments/order/${testData.orderId}/payment-status`,
    null,
    'Obtener Estado de Pago de Orden'
  ));
  
  // Pruebas de Checkout
  console.log('\n🛒 PRUEBAS DE CHECKOUT');
  console.log('=====================');
  
  results.checkout.push(await testEndpoint(
    'POST',
    `/checkout/${testData.userId}`,
    testData.checkoutData,
    'Checkout Básico'
  ));
  
  results.checkout.push(await testEndpoint(
    'POST',
    `/checkout/${testData.userId}/complete`,
    testData.checkoutData,
    'Checkout Completo'
  ));
  
  // Pruebas de Orders
  console.log('\n📦 PRUEBAS DE ORDERS');
  console.log('===================');
  
  results.orders.push(await testEndpoint(
    'GET',
    '/orders',
    null,
    'Obtener Todas las Órdenes'
  ));
  
  results.orders.push(await testEndpoint(
    'GET',
    `/orders/user/${testData.userId}`,
    null,
    'Obtener Órdenes de Usuario'
  ));
  
  results.orders.push(await testEndpoint(
    'GET',
    `/orders/${testData.orderId}`,
    null,
    'Obtener Orden por ID'
  ));
  
  // Resumen de resultados
  console.log('\n📊 RESUMEN DE RESULTADOS');
  console.log('========================');
  
  const modules = ['payments', 'checkout', 'orders'];
  for (const module of modules) {
    const successCount = results[module].filter(r => r).length;
    const totalCount = results[module].length;
    console.log(`${module.toUpperCase()}: ${successCount}/${totalCount} exitosas`);
  }
  
  console.log('\n🎯 Pruebas completadas.');
}

// Ejecutar pruebas
runTests().catch(console.error);
