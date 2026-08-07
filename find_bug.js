const fs = require('fs');
const path = require('path');

function searchDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (['node_modules', '.next', '.git'].includes(file)) continue;
            searchDir(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('.filter') && content.includes('.some') && content.includes('.replace')) {
                console.log('Match found in:', fullPath);
                // Also print lines containing .replace
                const lines = content.split('\n');
                lines.forEach((line, i) => {
                    if (line.includes('.replace')) {
                        console.log(`  Line ${i + 1}: ${line.trim()}`);
                    }
                });
            }
        }
    }
}

searchDir('.');
