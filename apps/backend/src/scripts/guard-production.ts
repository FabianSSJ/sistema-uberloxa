/**
 * Guard de seguridad para scripts de mantenimiento y seeds.
 * Previene la ejecución accidental de operaciones destructivas sobre la base de datos de producción.
 */
export function assertSafeEnvironment(scriptName: string, dbUrl: string) {
  const normalizedUrl = dbUrl || '';
  // Se considera base de producción si contiene 'uberloxa_db' y NO 'uberloxa_test_db'
  const isProdDb = normalizedUrl.includes('uberloxa_db') && !normalizedUrl.includes('uberloxa_test_db');
  const isProdEnv = process.env.NODE_ENV === 'production';
  const hasDangerousBypass = process.argv.includes('--force-dangerous-production-reset');

  if ((isProdDb || isProdEnv) && !hasDangerousBypass) {
    console.error(`\n🚨 ================================================================ 🚨`);
    console.error(`❌ OPERACIÓN BLOQUEADA POR SEGURIDAD DE DATOS`);
    console.error(`----------------------------------------------------------------`);
    console.error(`El script "${scriptName}" intentó ejecutarse en la base de datos de PRODUCCIÓN.`);
    console.error(`Base de datos objetivo: ${normalizedUrl.split('@')[1] || normalizedUrl}`);
    console.error(`\nMotivo de bloqueo:`);
    console.error(`Para evitar que se pierdan las carreras, clientes y cambios guardados por`);
    console.error(`los operadores, este script solo puede correrse en 'uberloxa_test_db'.`);
    console.error(`\nSi necesitas probar este script, ejecutalo apuntando a la base de test:`);
    console.error(`  DATABASE_URL="postgresql://uberloxa:uberloxa123@localhost:5436/uberloxa_test_db?schema=public" pnpm exec tsx src/scripts/${scriptName}`);
    console.error(`🚨 ================================================================ 🚨\n`);
    process.exit(1);
  }
}
