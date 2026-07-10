const fs = require('fs');
const path = require('path');

const dir = '/Users/gurpreetsingh/Desktop/Dripp Media Website';

const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace title
    content = content.replace(/<title>Dripp Media \| Surreal Agency<\/title>/g, '<title>Dripp Media | Creative Agency</title>');
    
    // Check if description exists, if not add it
    if (!content.includes('<meta name="description"')) {
        content = content.replace(
            /<title>Dripp Media \| Creative Agency<\/title>/g, 
            '<title>Dripp Media | Creative Agency</title>\n    <meta name="description" content="Dripp Media | Creative Agency. Interactive Portfolio. We specialize in graphic design, web development, and video production.">\n    <link rel="icon" type="image/png" href="favicon.png">'
        );
    }
    
    // Check if favicon link was added. If description existed but no favicon link, this regex will add it
    if (!content.includes('<link rel="icon"')) {
        content = content.replace(
            /<title>Dripp Media \| Creative Agency<\/title>/g, 
            '<title>Dripp Media | Creative Agency</title>\n    <link rel="icon" type="image/png" href="favicon.png">'
        );
    }
    
    // Replace emdashes with hyphens
    content = content.replace(/-/g, '-');
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
});
