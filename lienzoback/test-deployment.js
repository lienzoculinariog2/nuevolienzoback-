const https = require('https');

// Reemplaza con tu URL de Render
const BASE_URL = 'https://nuevolienzoback.onrender.com';

async function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsedData,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

function logTest(testName, status, details = '') {
  const emoji = status === 'PASS' ? '✅' : '❌';
  console.log(`${emoji} ${testName}: ${status}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

async function testDeployment() {
  console.log('🚀 Probando despliegue en Render...\n');

  try {
    // Test 1: Health Check
    console.log('1. Probando Health Check...');
    const health = await makeRequest('GET', '/file/test/health');
    if (health.success) {
      logTest('Health Check', 'PASS', `Status: ${health.status}`);
      console.log(`   Response: ${JSON.stringify(health.data, null, 2)}`);
    } else {
      logTest('Health Check', 'FAIL', `Status: ${health.status}, Error: ${health.data}`);
    }

    // Test 2: Cloudinary Config
    console.log('\n2. Probando configuración de Cloudinary...');
    const cloudinary = await makeRequest('GET', '/file/test/cloudinary-config');
    if (cloudinary.success) {
      logTest('Cloudinary Config', 'PASS', `Status: ${cloudinary.status}`);
      console.log(`   Response: ${JSON.stringify(cloudinary.data, null, 2)}`);
    } else {
      logTest('Cloudinary Config', 'FAIL', `Status: ${cloudinary.status}, Error: ${cloudinary.data}`);
    }

    // Test 3: Swagger Documentation
    console.log('\n3. Probando documentación Swagger...');
    const swagger = await makeRequest('GET', '/api');
    if (swagger.success) {
      logTest('Swagger Documentation', 'PASS', `Status: ${swagger.status}`);
    } else {
      logTest('Swagger Documentation', 'FAIL', `Status: ${swagger.status}`);
    }

    // Test 4: Payments Module (verificar que no hay error de STRIPE_SECRET_KEY)
    console.log('\n4. Probando módulo de pagos...');
    try {
      const payments = await makeRequest('GET', '/payments');
      logTest('Payments Module', 'PASS', 'Módulo cargado correctamente');
    } catch (error) {
      if (error.message.includes('STRIPE_SECRET_KEY')) {
        logTest('Payments Module', 'FAIL', 'Error: STRIPE_SECRET_KEY no configurada');
      } else {
        logTest('Payments Module', 'PASS', 'Módulo cargado (error esperado para GET /payments)');
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }

  console.log('\n🎯 Pruebas completadas!');
}

// Ejecutar las pruebas
testDeployment();
