const fs = require("fs");
const path = require("path");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Target paths inside standalone bundle
const standalonePath = path.join(__dirname, "../.next/standalone");

if (fs.existsSync(standalonePath)) {
  console.log("Copying assets to standalone directory...");
  copyDir(path.join(__dirname, "../public"), path.join(standalonePath, "public"));
  copyDir(path.join(__dirname, "../.next/static"), path.join(standalonePath, ".next/static"));
  console.log("Assets copied successfully!");
} else {
  console.warn("Standalone directory not found. Make sure output: 'standalone' is set in next.config.ts and you ran npm run build.");
}
