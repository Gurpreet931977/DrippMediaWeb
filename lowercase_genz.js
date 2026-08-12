const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, 'app');

function traverse(currentPath) {
    if (!fs.existsSync(currentPath)) return;
    
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
        const fullPath = path.join(currentPath, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            traverse(fullPath);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Pattern for single quotes
            const regexSingle = /isGenz\s*\?\s*'([^']+)'/g;
            content = content.replace(regexSingle, (match, p1) => {
                modified = true;
                return `isGenz ? '${p1.toLowerCase()}'`;
            });

            // Pattern for double quotes
            const regexDouble = /isGenz\s*\?\s*"([^"]+)"/g;
            content = content.replace(regexDouble, (match, p1) => {
                modified = true;
                return `isGenz ? "${p1.toLowerCase()}"`;
            });
            
            // Pattern for template literals (backticks) - excluding complex ones with ${} for safety, 
            // but we can try simple backticks
            const regexBacktick = /isGenz\s*\?\s*`([^`]+)`/g;
            content = content.replace(regexBacktick, (match, p1) => {
                modified = true;
                return `isGenz ? \`${p1.toLowerCase()}\``;
            });

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Lowercased GenZ strings in ${path.relative(dirPath, fullPath)}`);
            }
        }
    }
}

traverse(dirPath);
