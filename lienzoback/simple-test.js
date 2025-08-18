const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.response?.status || error.code}`);
    if (error.response?.data) {
      console.log(`   Details: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return { success: false, error: error.message };
  }
}

async function runSimpleTests() {
  console.log('🚀 Iniciando tests simples...\n');

  // Test 1: Verificar si el servidor está corriendo
  console.log('1. Verificando conectividad...');
  await testEndpoint('/api');

  // Test 2: Endpoints básicos
  console.log('\n2. Probando endpoints básicos...');
  await testEndpoint('/users');
  await testEndpoint('/categories');
  await testEndpoint('/products');
  await testEndpoint('/ingredients');

  // Test 3: Crear un usuario de prueba
  console.log('\n3. Probando creación de usuario...');
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user'
  };
  await testEndpoint('/users', 'POST', testUser);

  // Test 4: Login
  console.log('\n4. Probando login...');
  const loginData = {
    email: 'test@example.com',
    password: 'password123'
  };
  await testEndpoint('/auth/login', 'POST', loginData);

  console.log('\n🎉 Tests simples completados!');
}

// Ejecutar tests
runSimpleTests().catch(console.error);
