// Executa o teste que consulta a API wger de verdade (precisa de internet).
// Uso: npm run test:api  (funciona igual no Windows, macOS e Linux).
process.env.LIVE_API = '1';
require('jest').run(['--watchman=false', 'src/services/api/__tests__/exerciseApi.live.test.ts']);
