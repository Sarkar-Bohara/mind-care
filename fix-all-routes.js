const fs = require('fs');
const path = require('path');

function fixRouteFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already fixed
    if (content.includes("import { query }") || content.includes("from '@/lib/database'")) {
      return;
    }
    
    // Fix imports
    content = content.replace(/import pool from ['"]@\/lib\/db['"]/, "import { query } from '@/lib/database'");
    content = content.replace(/import.*db.*from ['"]@\/lib\/database['"]/, "import { query } from '@/lib/database'");
    
    // Fix pool.query calls
    content = content.replace(/pool\.query\(/g, 'query(');
    content = content.replace(/db\.query\(/g, 'query(');
    
    // Fix .rows references
    content = content.replace(/\.rows\[0\]/g, '[0]');
    content = content.replace(/\.rows\.length/g, '.length');
    content = content.replace(/\.rows/g, '');
    
    // Remove bcrypt imports
    content = content.replace(/import.*bcrypt.*\n/g, '');
    content = content.replace(/const bcrypt = require\(['"]bcrypt['"]\)\n/g, '');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.log(`Skipped: ${filePath} - ${error.message}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file === 'route.ts') {
      fixRouteFile(filePath);
    }
  });
}

// Fix all API routes
walkDir('./app/api');
console.log('All routes fixed!');