const fs = require('fs');
const path = require('path');

const zustandPath = path.join('node_modules', '@react-three', 'drei', 'node_modules', 'zustand');

if (!fs.existsSync(zustandPath)) {
  fs.mkdirSync(zustandPath, { recursive: true });
  fs.writeFileSync(path.join(zustandPath, 'index.mjs'), 'export default {}');
  fs.writeFileSync(path.join(zustandPath, 'middleware.mjs'), 'export default {}');
  fs.writeFileSync(path.join(zustandPath, 'shallow.mjs'), 'export default {}');
}