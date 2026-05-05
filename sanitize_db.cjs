const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'opportunities_db.json');

try {
  if (fs.existsSync(DB_PATH)) {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const db = JSON.parse(raw);
    const cleanDB = {};
    
    // Si la DB es un mapa, ya es única por llave. 
    // Pero vamos a asegurarnos de que los IDs internos coincidan.
    Object.keys(db).forEach(key => {
      const item = db[key];
      if (item && item.id) {
        cleanDB[item.id] = { ...item, id: item.id };
      }
    });

    fs.writeFileSync(DB_PATH, JSON.stringify(cleanDB, null, 2));
    console.log(`[Saneamiento] Base de datos limpia: ${Object.keys(cleanDB).length} registros únicos.`);
  }
} catch (e) {
  console.error('[Saneamiento] Error:', e.message);
}
