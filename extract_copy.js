const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, 'app');
const outputFile = path.join(__dirname, 'scratch', 'genz_copy.md');

let output = '| File | Current GenZ Text | Current Standard Text |\n|---|---|---|\n';

function traverse(currentPath) {
    if (!fs.existsSync(currentPath)) return;
    
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
        const fullPath = path.join(currentPath, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            traverse(fullPath);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Match patterns like: isGenz ? 'GenZ text' : 'Normal text'
                // Or: isGenz ? "GenZ" : "Normal"
                const regex = /isGenz\s*\?\s*(['"`])(.*?)\1\s*:\s*(['"`])(.*?)\3/g;
                let match;
                while ((match = regex.exec(line)) !== null) {
                    const genzText = match[2];
                    const stdText = match[4];
                    const relPath = path.relative(dirPath, fullPath);
                    output += `| ${relPath} | ${genzText} | ${stdText} |\n`;
                }
            }
        }
    }
}

traverse(dirPath);

if (!fs.existsSync(path.join(__dirname, 'scratch'))) {
    fs.mkdirSync(path.join(__dirname, 'scratch'));
}

fs.writeFileSync(outputFile, output);
console.log('Done extracting copy.');
