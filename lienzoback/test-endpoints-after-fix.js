const https = require('https');

const BASE_URL = 'https://nuevolienzoback.onrender.com';

console.log('🔍 PROBANDO ENDPOINTS DESPUÉS DEL FIX');
console.log('=====================================\n');

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'nuevolienzoback.onrender.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testEndpoints() {
  const endpoints = [
    { path: '/api/products', name: 'Products' },
    { path: '/api/categories', name: 'Categories' },
    { path: '/api/ingredients', name: 'Ingredients' },
    { path: '/api/auth', name: 'Auth' },
    { path: '/api/users', name: 'Users' },
    { path: '/health', name: 'Health' },
    { path: '/api', name: 'API Root' },
  ];

  console.log('⏳ Esperando que el deploy termine...');
  console.log('🔄 Probando endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Probando ${endpoint.name}: ${endpoint.path}`);
      const result = await makeRequest(endpoint.path);
      
      if (result.status === 200) {
        console.log(`✅ ${endpoint.name}: OK (${result.status})`);
        if (result.data && typeof result.data === 'object' && result.data.length !== undefined) {
          console.log(`   📊 Items: ${result.data.length}`);
        }
      } else if (result.status === 404) {
        console.log(`❌ ${endpoint.name}: Not Found (${result.status})`);
      } else {
        console.log(`⚠️  ${endpoint.name}: ${result.status} - ${JSON.stringify(result.data)}`);
      }
    } catch (error) {
      console.log(`💥 ${endpoint.name}: Error - ${error.message}`);
    }
    console.log('');
  }

  console.log('🎯 RESUMEN:');
  console.log('==========');
  console.log('✅ Endpoints que funcionan:');
  console.log('❌ Endpoints que no funcionan:');
  console.log('⚠️  Endpoints con problemas:');
  
  console.log('\n📝 PARA EL FRONTEND:');
  console.log('===================');
  console.log('URL Base: https://nuevolienzoback.onrender.com/api');
  console.log('Ejemplos:');
  console.log('- Productos: https://nuevolienzoback.onrender.com/api/products');
  console.log('- Categorías: https://nuevolienzoback.onrender.com/api/categories');
  console.log('- Ingredientes: https://nuevolienzoback.onrender.com/api/ingredients');
}

// Esperar 30 segundos para que termine el deploy
setTimeout(() => {
  testEndpoints().catch(console.error);
}, 30000);
