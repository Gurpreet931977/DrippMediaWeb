const fs = require('fs');
const path = require('path');

const adminLayoutPath = path.join(__dirname, 'app/admin-panel/layout.jsx');
let adminLayout = fs.readFileSync(adminLayoutPath, 'utf8');
adminLayout = adminLayout.replace('checkAuth();', `checkAuth();
    
    // Ensure body is visible and cursor is normal for admin panel
    document.body.classList.add('loaded');
    document.body.style.opacity = '1';
    document.body.style.cursor = 'auto';`);
fs.writeFileSync(adminLayoutPath, adminLayout);

const devModePath = path.join(__dirname, 'app/developermodeon/page.jsx');
let devMode = fs.readFileSync(devModePath, 'utf8');
devMode = devMode.replace('// Game initialization logic goes here', `// Game initialization logic goes here
    document.body.classList.add('loaded');
    document.body.style.opacity = '1';
    document.body.style.cursor = 'auto';`);
fs.writeFileSync(devModePath, devMode);

console.log('Fixed opacity for admin and dev mode.');
