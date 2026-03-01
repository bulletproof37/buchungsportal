const { Service } = require('node-windows');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const svc = new Service({
  name: 'Buchungsportal',
  description: 'Buchungsportal Bioferienhof Loreley GbR',
  script: path.join(rootDir, 'server', 'dist', 'index.js'),
  workingDirectory: rootDir,
  // Bei Absturz automatisch neu starten
  wait: 2,
  maxRetries: 5,
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    },
    {
      name: 'PORT',
      value: '3001'
    }
  ]
});

svc.on('install', () => {
  console.log('');
  console.log('  Dienst wurde installiert.');
  console.log('  Starte Dienst...');
  svc.start();
});

svc.on('start', () => {
  console.log('  Dienst läuft!');
  console.log('');
  console.log('  Portal erreichbar unter: http://localhost:3001');
  console.log('  Der Dienst startet automatisch mit Windows.');
  console.log('');
});

svc.on('error', (err) => {
  console.error('  FEHLER:', err);
});

svc.on('alreadyinstalled', () => {
  console.log('  Dienst ist bereits installiert.');
  console.log('  Zum Neu-Installieren: uninstall-service.bat ausführen, dann install-service.bat');
  console.log('');
});

console.log('  Installiere Windows-Dienst...');
svc.install();
