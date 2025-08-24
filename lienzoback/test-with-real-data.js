const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function getRealData() {
  try {
    // Obtener datos reales de la base de datos
    console.log('🔍 Obteniendo datos reales de la base de datos...');
    
    // 1. Obtener usuarios reales
    const usersResponse = await axios.get(`${BASE_URL}/users`);
    const users = usersResponse.data;
    console.log(`✅ Encontrados ${users.length} usuarios`);
    
    // 2. Obtener órdenes reales
    const ordersResponse = await axios.get(`${BASE_URL}/orders`);
    const orders = ordersResponse.data;
    console.log(`✅ Encontradas ${orders.length} órdenes`);
    
    // 3. Obtener productos reales
    const productsResponse = await axios.get(`${BASE_URL}/products`);
    const products = productsResponse.data;
    console.log(`✅ Encontrados ${products.length} productos`);
    
    return {
      users: users.length > 0 ? users[0] : null,
      orders: orders.length > 0 ? orders[0] : null,
      products: products.length > 0 ? products[0] : null
    };
  } catch (error) {
    console.error('❌ Error obteniendo datos reales:', error.message);
    return null;
  }
}

async function testWithRealData() {
  console.log('🧪 Pruebas con Datos Reales - Payments, Checkout y Orders');
  console.log('========================================================\n');
  
  const realData = await getRealData();
  
  if (!realData || !realData.users || !realData.orders) {
    console.log('❌ No se encontraron datos suficientes para las pruebas');
    return;
  }
  
  const testData = {
    userId: realData.users.id,
    orderId: realData.orders.id,
    productId: realData.products?.id,
    checkoutData: {
      shippingAddress: '123 Test Street, Test City',
      discountCode: null
    },
    paymentData: {
      orderId: realData.orders.id,
      customerEmail: realData.users.email,
      description: 'Test payment with real data'
    }
  };
  
  console.log('📋 Datos de prueba:');
  console.log(`   User ID: ${testData.userId}`);
  console.log(`   Order ID: ${testData.orderId}`);
  console.log(`   Product ID: ${testData.productId}`);
  console.log('');
  
  const results = {
    payments: [],
    checkout: [],
    orders: []
  };
  
  // Pruebas de Payments con datos reales
  console.log('💳 PRUEBAS DE PAYMENTS (con datos reales)');
  console.log('=========================================');
  
  results.payments.push(await testEndpoint(
    'POST',
    '/payments/create-payment-intent',
    testData.paymentData,
    'Crear Payment Intent con orden real'
  ));
  
  results.payments.push(await testEndpoint(
    'GET',
    `/payments/order/${testData.orderId}/payment-status`,
    null,
    'Obtener Estado de Pago de Orden real'
  ));
  
  // Pruebas de Checkout con datos reales
  console.log('\n🛒 PRUEBAS DE CHECKOUT (con datos reales)');
  console.log('==========================================');
  
  results.checkout.push(await testEndpoint(
    'POST',
    `/checkout/${testData.userId}`,
    testData.checkoutData,
    'Checkout Básico con usuario real'
  ));
  
  // Pruebas de Orders con datos reales
  console.log('\n📦 PRUEBAS DE ORDERS (con datos reales)');
  console.log('========================================');
  
  results.orders.push(await testEndpoint(
    'GET',
    `/orders/${testData.orderId}`,
    null,
    'Obtener Orden real por ID'
  ));
  
  results.orders.push(await testEndpoint(
    'GET',
    `/orders/user/${testData.userId}`,
    null,
    'Obtener Órdenes de Usuario real'
  ));
  
  // Resumen de resultados
  console.log('\n📊 RESUMEN DE RESULTADOS (con datos reales)');
  console.log('============================================');
  
  const modules = ['payments', 'checkout', 'orders'];
  for (const module of modules) {
    const successCount = results[module].filter(r => r).length;
    const totalCount = results[module].length;
    console.log(`${module.toUpperCase()}: ${successCount}/${totalCount} exitosas`);
  }
  
  console.log('\n🎯 Pruebas con datos reales completadas.');
}

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
    if (response.data && typeof response.data === 'object') {
      console.log(`   📄 Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
    } else {
      console.log(`   📄 Response: ${response.data}`);
    }
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.status || error.code}`);
    if (error.response?.data) {
      console.log(`   📄 Error Response: ${JSON.stringify(error.response.data, null, 2).substring(0, 200)}...`);
    } else {
      console.log(`   📄 Error Message: ${error.message}`);
    }
    return false;
  }
}

// Ejecutar pruebas
testWithRealData().catch(console.error);
