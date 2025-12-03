const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nUse this SQL to insert admin:');
  console.log(`INSERT INTO users (name, email, password, role, is_verified) VALUES ('Admin', 'admin@selempangku.com', '${hash}', 'admin', TRUE);`);
}

generateHash();
