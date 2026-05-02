const db = require('./db/index.js');
const qrcode = require('qrcode');

async function fix() {
  const tables = db.prepare("SELECT id, table_number FROM tables").all();
  for (const t of tables) {
    const menuUrl = `http://13.48.192.200/menu/${t.id}`;
    const qr_code_url = await qrcode.toDataURL(menuUrl);
    db.prepare('UPDATE tables SET qr_code_url = ? WHERE id = ?').run(qr_code_url, t.id);
    console.log(`Generated QR for table ${t.table_number}`);
  }
}
fix();
