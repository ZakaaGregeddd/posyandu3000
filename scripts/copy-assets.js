const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    if (fs.lstatSync(path.join(from, element)).isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    } else {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    }
  });
}

// Copy public folder to standalone public
copyFolderSync(
  path.join(__dirname, '../public'),
  path.join(__dirname, '../.next/standalone/public')
);

// Copy static assets to standalone static
copyFolderSync(
  path.join(__dirname, '../.next/static'),
  path.join(__dirname, '../.next/standalone/.next/static')
);

console.log('Aset statis berhasil disalin ke standalone build!');
