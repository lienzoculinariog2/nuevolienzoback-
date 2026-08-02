const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(`🔍 ${title}`, 'cyan');
  console.log('='.repeat(80));
}

function logStep(step, message, status = 'info') {
  const statusIcon = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  const statusColor = {
    info: 'white',
    success: 'green',
    warning: 'yellow',
    error: 'red'
  };
  
  log(`${statusIcon[status]} ${step}: ${message}`, statusColor[status]);
}

function runScript(scriptName, description) {
  return new Promise((resolve, reject) => {
    try {
      logStep(`Ejecutando ${scriptName}`, description, 'info');
      
      const result = execSync(`node ${scriptName}`, { 
        encoding: 'utf8',
        cwd: __dirname,
        stdio: 'pipe'
      });
      
      logStep(`${scriptName} completado`, 'Ejecutado exitosamente', 'success');
      resolve(result);
    } catch (error) {
      logStep(`${scriptName} falló`, error.message, 'error');
      reject(error);
    }
  });
}

async function checkServerStatus() {
  logSection('VERIFICACIÓN INICIAL DEL SERVIDOR');
  
  try {
    // Verificar si el servidor está ejecutándose
    logStep('1', 'Verificando si el servidor está ejecutándose...', 'info');
    
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    try {
      // Intentar hacer una petición al servidor
      const { stdout } = await execAsync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/products');
      
      if (stdout.trim() === '200') {
        logStep('2', 'Servidor está ejecutándose y respondiendo', 'success');
        return true;
      } else {
        logStep('2', `Servidor responde con código: ${stdout.trim()}`, 'warning');
        return false;
      }
    } catch (error) {
      logStep('2', 'Servidor no está ejecutándose o no responde', 'error');
      logStep('3', 'Por favor, inicia el servidor con: npm run start:dev', 'warning');
      return false;
    }
    
  } catch (error) {
    logStep('ERROR', `Error verificando servidor: ${error.message}`, 'error');
    return false;
  }
}

async function runAllDebugging() {
  console.clear();
  log('🔍 ===== DEBUGGING MAESTRO COMPLETO DEL SISTEMA =====', 'bright');
  log(`📅 Timestamp: ${new Date().toISOString()}`, 'info');
  log(`📁 Directorio: ${__dirname}`, 'info');
  log('', 'white');
  
  const results = {
    serverStatus: false,
    environmentConfig: false,
    completeSystem: false,
    problematicModules: false,
    inconsistencies: false
  };
  
  try {
    // 1. Verificar estado del servidor
    results.serverStatus = await checkServerStatus();
    
    if (!results.serverStatus) {
      log('\n⚠️ ADVERTENCIA: El servidor no está ejecutándose', 'yellow');
      log('Algunas verificaciones pueden fallar. Se recomienda iniciar el servidor primero.', 'yellow');
      log('Comando: npm run start:dev', 'yellow');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        rl.question('\n¿Deseas continuar con el debugging sin el servidor? (y/N): ', resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        log('Debugging cancelado por el usuario', 'yellow');
        return;
      }
    }
    
    // 2. Ejecutar debugging de configuración del entorno
    logSection('PASO 1: VERIFICACIÓN DE CONFIGURACIÓN DEL ENTORNO');
    try {
      await runScript('debug-environment-config.js', 'Verificando configuración del entorno');
      results.environmentConfig = true;
    } catch (error) {
      logStep('Error en configuración del entorno', error.message, 'error');
      results.environmentConfig = false;
    }
    
    // 3. Ejecutar debugging completo del sistema (solo si el servidor está ejecutándose)
    if (results.serverStatus) {
      logSection('PASO 2: VERIFICACIÓN COMPLETA DEL SISTEMA');
      try {
        await runScript('debug-complete-system.js', 'Verificando todos los módulos del sistema');
        results.completeSystem = true;
      } catch (error) {
        logStep('Error en verificación completa', error.message, 'error');
        results.completeSystem = false;
      }
    } else {
      logSection('PASO 2: VERIFICACIÓN COMPLETA DEL SISTEMA');
      logStep('Omitido', 'Servidor no está ejecutándose', 'warning');
    }
    
    // 4. Ejecutar debugging detallado de módulos problemáticos (solo si el servidor está ejecutándose)
    if (results.serverStatus) {
      logSection('PASO 3: VERIFICACIÓN DETALLADA DE MÓDULOS PROBLEMÁTICOS');
      try {
        await runScript('debug-problematic-modules.js', 'Verificando módulos problemáticos en detalle');
        results.problematicModules = true;
      } catch (error) {
        logStep('Error en verificación de módulos problemáticos', error.message, 'error');
        results.problematicModules = false;
      }
    } else {
      logSection('PASO 3: VERIFICACIÓN DETALLADA DE MÓDULOS PROBLEMÁTICOS');
      logStep('Omitido', 'Servidor no está ejecutándose', 'warning');
    }
    
    // 5. Ejecutar debugging de inconsistencias (solo si el servidor está ejecutándose)
    if (results.serverStatus) {
      logSection('PASO 4: VERIFICACIÓN DE INCONSISTENCIAS');
      try {
        await runScript('debug-inconsistencies.js', 'Verificando inconsistencias del sistema');
        results.inconsistencies = true;
      } catch (error) {
        logStep('Error en verificación de inconsistencias', error.message, 'error');
        results.inconsistencies = false;
      }
    } else {
      logSection('PASO 4: VERIFICACIÓN DE INCONSISTENCIAS');
      logStep('Omitido', 'Servidor no está ejecutándose', 'warning');
    }
    
  } catch (error) {
    logStep('ERROR FATAL', `Error en debugging maestro: ${error.message}`, 'error');
  }
  
  // Generar reporte final
  await generateMasterReport(results);
}

async function generateMasterReport(results) {
  logSection('REPORTE FINAL DEL DEBUGGING MAESTRO');
  
  const totalSteps = Object.keys(results).length;
  const successfulSteps = Object.values(results).filter(r => r === true).length;
  const failedSteps = totalSteps - successfulSteps;
  
  log('📊 RESUMEN DE EJECUCIÓN:', 'cyan');
  logStep('Total de pasos', `${totalSteps}`, 'info');
  logStep('Pasos exitosos', `${successfulSteps}`, 'success');
  logStep('Pasos fallidos', `${failedSteps}`, failedSteps > 0 ? 'error' : 'success');
  
  log('\n📋 DETALLE POR PASO:', 'cyan');
  
  if (results.serverStatus) {
    logStep('Servidor', '✅ Ejecutándose correctamente', 'success');
  } else {
    logStep('Servidor', '❌ No está ejecutándose', 'error');
  }
  
  if (results.environmentConfig) {
    logStep('Configuración del entorno', '✅ Verificada correctamente', 'success');
  } else {
    logStep('Configuración del entorno', '❌ Problemas encontrados', 'error');
  }
  
  if (results.serverStatus && results.completeSystem) {
    logStep('Verificación completa del sistema', '✅ Ejecutada correctamente', 'success');
  } else if (!results.serverStatus) {
    logStep('Verificación completa del sistema', '⚠️ Omitida (servidor no ejecutándose)', 'warning');
  } else {
    logStep('Verificación completa del sistema', '❌ Problemas encontrados', 'error');
  }
  
  if (results.serverStatus && results.problematicModules) {
    logStep('Verificación de módulos problemáticos', '✅ Ejecutada correctamente', 'success');
  } else if (!results.serverStatus) {
    logStep('Verificación de módulos problemáticos', '⚠️ Omitida (servidor no ejecutándose)', 'warning');
  } else {
    logStep('Verificación de módulos problemáticos', '❌ Problemas encontrados', 'error');
  }
  
  if (results.serverStatus && results.inconsistencies) {
    logStep('Verificación de inconsistencias', '✅ Ejecutada correctamente', 'success');
  } else if (!results.serverStatus) {
    logStep('Verificación de inconsistencias', '⚠️ Omitida (servidor no ejecutándose)', 'warning');
  } else {
    logStep('Verificación de inconsistencias', '❌ Problemas encontrados', 'error');
  }
  
  // Recomendaciones finales
  log('\n🔧 RECOMENDACIONES FINALES:', 'cyan');
  
  if (!results.serverStatus) {
    log('   - Inicia el servidor con: npm run start:dev', 'yellow');
    log('   - Ejecuta nuevamente este debugging para verificar todos los módulos', 'yellow');
  }
  
  if (!results.environmentConfig) {
    log('   - Revisa y corrige los problemas de configuración del entorno', 'yellow');
    log('   - Verifica que todas las variables de entorno estén configuradas', 'yellow');
  }
  
  if (results.serverStatus && !results.completeSystem) {
    log('   - Revisa los logs del servidor para identificar problemas', 'yellow');
    log('   - Verifica que todos los módulos estén correctamente implementados', 'yellow');
  }
  
  if (results.serverStatus && !results.problematicModules) {
    log('   - Revisa específicamente los módulos de notifications, checkout y payments', 'yellow');
    log('   - Verifica las configuraciones de Stripe y email', 'yellow');
  }
  
  if (results.serverStatus && !results.inconsistencies) {
    log('   - Revisa las inconsistencias encontradas en datos y lógica de negocio', 'yellow');
    log('   - Ejecuta limpieza de datos si es necesario', 'yellow');
  }
  
  // Estado general
  log('\n🎯 ESTADO GENERAL:', 'cyan');
  if (failedSteps === 0) {
    log('🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!', 'green');
    log('Todos los componentes están funcionando correctamente.', 'green');
  } else if (failedSteps === 1 && !results.serverStatus) {
    log('✅ SISTEMA FUNCIONAL (solo falta iniciar servidor)', 'green');
    log('El sistema está configurado correctamente, solo necesitas iniciar el servidor.', 'green');
  } else {
    log('⚠️ SISTEMA REQUIERE ATENCIÓN', 'yellow');
    log('Se encontraron problemas que requieren corrección.', 'yellow');
  }
  
  log('\n📝 PRÓXIMOS PASOS:', 'cyan');
  if (!results.serverStatus) {
    log('1. Inicia el servidor: npm run start:dev', 'white');
    log('2. Ejecuta nuevamente: node debug-master.js', 'white');
  } else if (failedSteps > 0) {
    log('1. Revisa los problemas identificados arriba', 'white');
    log('2. Corrige las configuraciones necesarias', 'white');
    log('3. Ejecuta nuevamente: node debug-master.js', 'white');
  } else {
    log('1. ¡Tu sistema está listo para usar!', 'white');
    log('2. Puedes proceder con el desarrollo normal', 'white');
  }
}

// Función para mostrar ayuda
function showHelp() {
  log('🔍 DEBUGGING MAESTRO - AYUDA', 'bright');
  log('', 'white');
  log('Este script ejecuta una verificación completa del sistema:', 'white');
  log('', 'white');
  log('1. Verifica si el servidor está ejecutándose', 'white');
  log('2. Revisa la configuración del entorno', 'white');
  log('3. Verifica todos los módulos del sistema', 'white');
  log('4. Hace debugging detallado de módulos problemáticos', 'white');
  log('', 'white');
  log('Uso:', 'cyan');
  log('   node debug-master.js', 'white');
  log('', 'white');
  log('Recomendación:', 'yellow');
  log('   Ejecuta este script después de iniciar el servidor con: npm run start:dev', 'white');
}

// Verificar argumentos de línea de comandos
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Ejecutar el debugging maestro
runAllDebugging().catch(error => {
  log(`❌ Error fatal en debugging maestro: ${error.message}`, 'error');
  process.exit(1);
});
