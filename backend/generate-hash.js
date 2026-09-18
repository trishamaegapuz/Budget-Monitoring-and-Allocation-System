const bcrypt = require('bcrypt');

async function makeHash() {
  const hash = await bcrypt.hash('admin123', 10);
  console.log('--------------------------------------------------');
  console.log('COPY THIS HASH TO POSTGRESQL:');
  console.log(hash);
  console.log('--------------------------------------------------');
}

makeHash();