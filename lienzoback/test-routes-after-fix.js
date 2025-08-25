const https = require('https');

console.log('🔍 PROBANDO RUTAS DESPUÉS DEL FIX');
console.log('==================================\n');

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

async function testRoutes() {
  const routes = [
    { path: '/api/products', name: 'Products' },
    { path: '/api/categories', name: 'Categories' },
    { path: '/api/ingredients', name: 'Ingredients' },
    { path: '/api/auth', name: 'Auth' },
    { path: '/api/users', name: 'Users' },
    { path: '/docs', name: 'Swagger Docs' },
  ];

  console.log('⏳ Esperando que el deploy termine...');
  console.log('🔄 Probando rutas...\n');

  for (const route of routes) {
    try {
      console.log(`🔍 Probando ${route.name}: ${route.path}`);
      const result = await makeRequest(route.path);
      
      if (result.status === 200) {
        console.log(`✅ ${route.name}: OK (${result.status})`);
        if (result.data && typeof result.data === 'object' && result.data.length !== undefined) {
          console.log(`   📊 Items: ${result.data.length}`);
        }
      } else if (result.status === 404) {
        console.log(`❌ ${route.name}: Not Found (${result.status})`);
      } else {
        console.log(`⚠️  ${route.name}: ${result.status}`);
      }
    } catch (error) {
      console.log(`💥 ${route.name}: Error - ${error.message}`);
    }
    console.log('');
  }

  console.log('🎯 RESUMEN:');
  console.log('==========');
  console.log('✅ Rutas que funcionan:');
  console.log('❌ Rutas que no funcionan:');
  console.log('⚠️  Rutas con problemas:');
  
  console.log('\n📝 PARA EL FRONTEND:');
  console.log('===================');
  console.log('URL Base: https://nuevolienzoback.onrender.com/api');
  console.log('Swagger: https://nuevolienzoback.onrender.com/docs');
  console.log('Ejemplos:');
  console.log('- Productos: https://nuevolienzoback.onrender.com/api/products');
  console.log('- Categorías: https://nuevolienzoback.onrender.com/api/categories');
  console.log('- Ingredientes: https://nuevolienzoback.onrender.com/api/ingredients');
}

// Esperar 30 segundos para que termine el deploy
setTimeout(() => {
  testRoutes().catch(console.error);
}, 30000);
