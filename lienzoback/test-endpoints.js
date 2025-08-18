const axios = require('axios');

// Configuración base
const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

// Colores para console.log
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Variables globales para testing
let authToken = null;
let userId = null;
let productId = null;
let categoryId = null;
let cartId = null;
let orderId = null;

// Función helper para logging
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : 'red';
  const statusSymbol = status === 'PASS' ? '✅' : '❌';
  console.log(`${colors[statusSymbol]} ${colors[statusColor]}${testName}${colors.reset} ${details}`);
}

// Función helper para hacer requests
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
}

// ===== TESTS DE CONECTIVIDAD =====
async function testConnectivity() {
  log('\n🔌 TESTING CONECTIVIDAD', 'bold');
  
  const result = await makeRequest('GET', '/api');
  if (result.success) {
    logTest('Swagger UI disponible', 'PASS', `Status: ${result.status}`);
  } else {
    logTest('Swagger UI disponible', 'FAIL', `Error: ${result.error}`);
  }
}

// ===== TESTS DE USUARIOS =====
async function testUsers() {
  log('\n👥 TESTING MÓDULO DE USUARIOS', 'bold');

  // Test 1: Obtener todos los usuarios
  const getUsers = await makeRequest('GET', '/users');
  if (getUsers.success) {
    logTest('GET /users - Obtener usuarios', 'PASS', `Encontrados: ${getUsers.data.length}`);
  } else {
    logTest('GET /users - Obtener usuarios', 'FAIL', `Error: ${getUsers.error}`);
  }

  // Test 2: Crear usuario
  const newUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user'
  };

  const createUser = await makeRequest('POST', '/users', newUser);
  if (createUser.success) {
    userId = createUser.data.id;
    logTest('POST /users - Crear usuario', 'PASS', `ID: ${userId}`);
  } else {
    logTest('POST /users - Crear usuario', 'FAIL', `Error: ${createUser.error}`);
  }

  // Test 3: Obtener usuario por ID
  if (userId) {
    const getUser = await makeRequest('GET', `/users/${userId}`);
    if (getUser.success) {
      logTest('GET /users/:id - Obtener usuario', 'PASS');
    } else {
      logTest('GET /users/:id - Obtener usuario', 'FAIL', `Error: ${getUser.error}`);
    }
  }
}

// ===== TESTS DE CATEGORÍAS =====
async function testCategories() {
  log('\n📂 TESTING MÓDULO DE CATEGORÍAS', 'bold');

  // Test 1: Obtener todas las categorías
  const getCategories = await makeRequest('GET', '/categories');
  if (getCategories.success) {
    logTest('GET /categories - Obtener categorías', 'PASS', `Encontradas: ${getCategories.data.length}`);
    if (getCategories.data.length > 0) {
      categoryId = getCategories.data[0].id;
    }
  } else {
    logTest('GET /categories - Obtener categorías', 'FAIL', `Error: ${getCategories.error}`);
  }

  // Test 2: Crear categoría
  const newCategory = {
    name: 'Test Category',
    description: 'Categoría de prueba'
  };

  const createCategory = await makeRequest('POST', '/categories', newCategory);
  if (createCategory.success) {
    logTest('POST /categories - Crear categoría', 'PASS', `ID: ${createCategory.data.id}`);
  } else {
    logTest('POST /categories - Crear categoría', 'FAIL', `Error: ${createCategory.error}`);
  }
}

// ===== TESTS DE PRODUCTOS =====
async function testProducts() {
  log('\n🛍️ TESTING MÓDULO DE PRODUCTOS', 'bold');

  // Test 1: Obtener todos los productos
  const getProducts = await makeRequest('GET', '/products');
  if (getProducts.success) {
    logTest('GET /products - Obtener productos', 'PASS', `Encontrados: ${getProducts.data.length}`);
    if (getProducts.data.length > 0) {
      productId = getProducts.data[0].id;
    }
  } else {
    logTest('GET /products - Obtener productos', 'FAIL', `Error: ${getProducts.error}`);
  }

  // Test 2: Crear producto
  const newProduct = {
    name: 'Test Product',
    description: 'Producto de prueba',
    price: 29.99,
    stock: 10,
    caloricLevel: 250,
    categoryId: categoryId || '1',
    ingredients: ['ingrediente1', 'ingrediente2']
  };

  const createProduct = await makeRequest('POST', '/products', newProduct);
  if (createProduct.success) {
    logTest('POST /products - Crear producto', 'PASS', `ID: ${createProduct.data.id}`);
  } else {
    logTest('POST /products - Crear producto', 'FAIL', `Error: ${createProduct.error}`);
  }

  // Test 3: Buscar productos por ingrediente
  const searchByIngredient = await makeRequest('GET', '/products?ingredient=ingrediente1');
  if (searchByIngredient.success) {
    logTest('GET /products?ingredient - Búsqueda por ingrediente', 'PASS', `Encontrados: ${searchByIngredient.data.length}`);
  } else {
    logTest('GET /products?ingredient - Búsqueda por ingrediente', 'FAIL', `Error: ${searchByIngredient.error}`);
  }

  // Test 4: Obtener producto por ID
  if (productId) {
    const getProduct = await makeRequest('GET', `/products/${productId}`);
    if (getProduct.success) {
      logTest('GET /products/:id - Obtener producto', 'PASS');
    } else {
      logTest('GET /products/:id - Obtener producto', 'FAIL', `Error: ${getProduct.error}`);
    }
  }
}

// ===== TESTS DE AUTENTICACIÓN =====
async function testAuth() {
  log('\n🔐 TESTING MÓDULO DE AUTENTICACIÓN', 'bold');

  // Test 1: Login
  const loginData = {
    email: 'test@example.com',
    password: 'password123'
  };

  const login = await makeRequest('POST', '/auth/login', loginData);
  if (login.success) {
    authToken = login.data.access_token;
    logTest('POST /auth/login - Login', 'PASS');
  } else {
    logTest('POST /auth/login - Login', 'FAIL', `Error: ${login.error}`);
  }

  // Test 2: Obtener perfil (con token)
  if (authToken) {
    const profile = await makeRequest('GET', '/auth/profile', null, {
      'Authorization': `Bearer ${authToken}`
    });
    if (profile.success) {
      logTest('GET /auth/profile - Obtener perfil', 'PASS');
    } else {
      logTest('GET /auth/profile - Obtener perfil', 'FAIL', `Error: ${profile.error}`);
    }
  }
}

// ===== TESTS DE CARRITO =====
async function testCart() {
  log('\n🛒 TESTING MÓDULO DE CARRITO', 'bold');

  if (!authToken || !productId) {
    logTest('Carrito - Tests', 'FAIL', 'Requiere autenticación y producto');
    return;
  }

  // Test 1: Agregar producto al carrito
  const addToCart = await makeRequest('POST', '/cart/add', {
    productId: productId,
    quantity: 2
  }, {
    'Authorization': `Bearer ${authToken}`
  });

  if (addToCart.success) {
    cartId = addToCart.data.id;
    logTest('POST /cart/add - Agregar al carrito', 'PASS');
  } else {
    logTest('POST /cart/add - Agregar al carrito', 'FAIL', `Error: ${addToCart.error}`);
  }

  // Test 2: Obtener carrito
  const getCart = await makeRequest('GET', '/cart', null, {
    'Authorization': `Bearer ${authToken}`
  });

  if (getCart.success) {
    logTest('GET /cart - Obtener carrito', 'PASS');
  } else {
    logTest('GET /cart - Obtener carrito', 'FAIL', `Error: ${getCart.error}`);
  }
}

// ===== TESTS DE ÓRDENES =====
async function testOrders() {
  log('\n📦 TESTING MÓDULO DE ÓRDENES', 'bold');

  if (!authToken) {
    logTest('Órdenes - Tests', 'FAIL', 'Requiere autenticación');
    return;
  }

  // Test 1: Crear orden
  const newOrder = {
    items: [{
      productId: productId,
      quantity: 1,
      price: 29.99
    }],
    total: 29.99,
    status: 'pending'
  };

  const createOrder = await makeRequest('POST', '/orders', newOrder, {
    'Authorization': `Bearer ${authToken}`
  });

  if (createOrder.success) {
    orderId = createOrder.data.id;
    logTest('POST /orders - Crear orden', 'PASS', `ID: ${orderId}`);
  } else {
    logTest('POST /orders - Crear orden', 'FAIL', `Error: ${createOrder.error}`);
  }

  // Test 2: Obtener órdenes del usuario
  const getOrders = await makeRequest('GET', '/orders', null, {
    'Authorization': `Bearer ${authToken}`
  });

  if (getOrders.success) {
    logTest('GET /orders - Obtener órdenes', 'PASS', `Encontradas: ${getOrders.data.length}`);
  } else {
    logTest('GET /orders - Obtener órdenes', 'FAIL', `Error: ${getOrders.error}`);
  }
}

// ===== TESTS DE RESEÑAS =====
async function testReviews() {
  log('\n⭐ TESTING MÓDULO DE RESEÑAS', 'bold');

  if (!authToken || !productId) {
    logTest('Reseñas - Tests', 'FAIL', 'Requiere autenticación y producto');
    return;
  }

  // Test 1: Crear reseña
  const newReview = {
    productId: productId,
    rating: 5,
    comment: 'Excelente producto de prueba'
  };

  const createReview = await makeRequest('POST', '/reviews', newReview, {
    'Authorization': `Bearer ${authToken}`
  });

  if (createReview.success) {
    logTest('POST /reviews - Crear reseña', 'PASS');
  } else {
    logTest('POST /reviews - Crear reseña', 'FAIL', `Error: ${createReview.error}`);
  }

  // Test 2: Obtener reseñas de un producto
  const getReviews = await makeRequest('GET', `/reviews/product/${productId}`);
  if (getReviews.success) {
    logTest('GET /reviews/product/:id - Obtener reseñas', 'PASS', `Encontradas: ${getReviews.data.length}`);
  } else {
    logTest('GET /reviews/product/:id - Obtener reseñas', 'FAIL', `Error: ${getReviews.error}`);
  }
}

// ===== TESTS DE CÓDIGOS DE DESCUENTO =====
async function testDiscountCodes() {
  log('\n🎫 TESTING MÓDULO DE CÓDIGOS DE DESCUENTO', 'bold');

  // Test 1: Obtener códigos de descuento
  const getCodes = await makeRequest('GET', '/discount-codes');
  if (getCodes.success) {
    logTest('GET /discount-codes - Obtener códigos', 'PASS', `Encontrados: ${getCodes.data.length}`);
  } else {
    logTest('GET /discount-codes - Obtener códigos', 'FAIL', `Error: ${getCodes.error}`);
  }

  // Test 2: Crear código de descuento
  const newCode = {
    code: 'TEST20',
    discountPercentage: 20,
    maxUses: 100,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
  };

  const createCode = await makeRequest('POST', '/discount-codes', newCode);
  if (createCode.success) {
    logTest('POST /discount-codes - Crear código', 'PASS');
  } else {
    logTest('POST /discount-codes - Crear código', 'FAIL', `Error: ${createCode.error}`);
  }
}

// ===== TESTS DE INGREDIENTES =====
async function testIngredients() {
  log('\n🥘 TESTING MÓDULO DE INGREDIENTES', 'bold');

  // Test 1: Obtener ingredientes
  const getIngredients = await makeRequest('GET', '/ingredients');
  if (getIngredients.success) {
    logTest('GET /ingredients - Obtener ingredientes', 'PASS', `Encontrados: ${getIngredients.data.length}`);
  } else {
    logTest('GET /ingredients - Obtener ingredientes', 'FAIL', `Error: ${getIngredients.error}`);
  }

  // Test 2: Crear ingrediente
  const newIngredient = {
    name: 'Test Ingredient',
    description: 'Ingrediente de prueba'
  };

  const createIngredient = await makeRequest('POST', '/ingredients', newIngredient);
  if (createIngredient.success) {
    logTest('POST /ingredients - Crear ingrediente', 'PASS');
  } else {
    logTest('POST /ingredients - Crear ingrediente', 'FAIL', `Error: ${createIngredient.error}`);
  }
}

// ===== TESTS DE FILE UPLOAD =====
async function testFileUpload() {
  log('\n📁 TESTING MÓDULO DE FILE UPLOAD', 'bold');

  // Test 1: Verificar endpoint de salud
  const health = await makeRequest('GET', '/file/test/health');
  if (health.success) {
    logTest('GET /file/test/health - Endpoint de salud', 'PASS');
  } else {
    logTest('GET /file/test/health - Endpoint de salud', 'FAIL', `Error: ${health.error}`);
  }

  // Test 2: Verificar configuración de Cloudinary
  const cloudinaryConfig = await makeRequest('GET', '/file/test/cloudinary-config');
  if (cloudinaryConfig.success) {
    logTest('GET /file/test/cloudinary-config - Configuración Cloudinary', 'PASS');
  } else {
    logTest('GET /file/test/cloudinary-config - Configuración Cloudinary', 'FAIL', `Error: ${cloudinaryConfig.error}`);
  }
}

// ===== FUNCIÓN PRINCIPAL =====
async function runAllTests() {
  log('🚀 INICIANDO TESTS COMPLETOS DEL PROYECTO', 'bold');
  log('==========================================', 'blue');

  try {
    await testConnectivity();
    await testUsers();
    await testCategories();
    await testProducts();
    await testAuth();
    await testCart();
    await testOrders();
    await testReviews();
    await testDiscountCodes();
    await testIngredients();
    await testFileUpload();

    log('\n🎉 TESTS COMPLETADOS', 'bold');
    log('==================', 'green');
    
  } catch (error) {
    log(`\n❌ ERROR EN LOS TESTS: ${error.message}`, 'red');
  }
}

// Ejecutar tests
runAllTests();
