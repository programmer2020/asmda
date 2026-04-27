const fs = require('fs');
const lines = fs.readFileSync('frontend/src/App.jsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if(l.includes('final-product-store') || l.includes('إضافة منتج')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
