const fs = require('fs');
let errorFile = fs.readFileSync('app/error.jsx', 'utf8');
errorFile = errorFile.replace(
  "position: 'relative', overflow: 'hidden'",
  "position: 'relative', overflow: 'hidden', cursor: 'auto'"
);
fs.writeFileSync('app/error.jsx', errorFile);

let globalErrorFile = fs.readFileSync('app/global-error.jsx', 'utf8');
globalErrorFile = globalErrorFile.replace(
  "position: 'relative', overflow: 'hidden'",
  "position: 'relative', overflow: 'hidden', cursor: 'auto'"
);
fs.writeFileSync('app/global-error.jsx', globalErrorFile);
console.log("Cursor fixed in error pages.");
