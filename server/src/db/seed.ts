import { queryOne, run, saveDatabase } from './database.js';

/**
 * Füllt die Datenbank mit Initialdaten
 */
export function seedDatabase(): void {
  // Prüfen ob bereits Häuser existieren
  const houseCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM houses');

  if (!houseCount || houseCount.count === 0) {
    console.log('Füge Ferienhäuser hinzu...');

    // Die 5 Ferienhäuser mit ihren Nachtpreisen
    const houses = [
      { name: 'Småland', price_per_night: 90, sort_order: 1 },
      { name: 'Dalarna', price_per_night: 80, sort_order: 2 },
      { name: 'Lönneberga', price_per_night: 80, sort_order: 3 },
      { name: 'Lappland', price_per_night: 60, sort_order: 4 },
      { name: 'Värmland', price_per_night: 70, sort_order: 5 }
    ];

    for (const house of houses) {
      run(
        'INSERT INTO houses (name, price_per_night, sort_order) VALUES (?, ?, ?)',
        [house.name, house.price_per_night, house.sort_order]
      );
    }

    console.log(`${houses.length} Ferienhäuser eingefügt.`);
  }

  // Prüfen ob bereits Einstellungen existieren
  const settingsCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM settings');

  if (!settingsCount || settingsCount.count === 0) {
    console.log('Füge Standardeinstellungen hinzu...');

    // Standard-Einstellungen
    const settings = [
      { key: 'company_name', value: 'Bioferienhof Loreley GbR' },
      { key: 'company_address', value: 'Auf dem Flürchen' },
      { key: 'company_zip', value: '56329' },
      { key: 'company_city', value: 'St. Goar-Biebernheim' },
      { key: 'company_phone', value: '' },
      { key: 'company_mobile', value: '0173 9267942' },
      { key: 'company_email', value: 'bioferienhof.loreley@gmail.com' },
      { key: 'surcharge_first_night', value: '35' },
      { key: 'price_per_dog_night', value: '5' },
      { key: 'min_nights', value: '2' }
    ];

    for (const setting of settings) {
      run(
        'INSERT INTO settings (key, value) VALUES (?, ?)',
        [setting.key, setting.value]
      );
    }

    console.log(`${settings.length} Einstellungen eingefügt.`);
  }

  saveDatabase();
  console.log('Seed-Daten erfolgreich eingefügt.');
}

export default seedDatabase;
