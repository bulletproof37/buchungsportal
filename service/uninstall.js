const { Service } = require('node-windows');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const svc = new Service({
  name: 'Buchungsportal',
  script: path.join(rootDir, 'server', 'dist', 'index.js'),
  workingDirectory: rootDir
});

svc.on('uninstall', () => {
  console.log('');
  console.log('  Dienst wurde entfernt.');
  console.log('  Das Portal startet nicht mehr automatisch mit Windows.');
  console.log('');
});

svc.on('error', (err) => {
  console.error('  FEHLER:', err);
});

svc.on('notinstalled', () => {
  console.log('  Dienst ist nicht installiert.');
  console.log('');
});

console.log('  Entferne Windows-Dienst...');
svc.uninstall();
