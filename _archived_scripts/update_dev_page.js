const fs = require('fs');
let content = fs.readFileSync('app/developermodeon/page.jsx', 'utf8');

// 1. Remove the isArcadeOpen state hook
content = content.replace(/const \[isArcadeOpen, setIsArcadeOpen\] = useState\(false\);\n/, '');

// 2. Remove the ArcadeEngine overlay wrapper
const overlayRegex = /\{\s*isArcadeOpen && \([\s\S]*?<ArcadeEngine onClose=\{\(\) => setIsArcadeOpen\(false\)\} \/>[\s\S]*?\}\)/;
content = content.replace(overlayRegex, '');

// 3. Update the floating button onClick
content = content.replace(/onClick=\{\(\) => setIsArcadeOpen\(true\)\}/, "onClick={() => window.location.href = '/arcade'}");

// 4. Remove the ArcadeEngine import
content = content.replace(/import ArcadeEngine from '\.\/components\/ArcadeEngine';\n/, '');
content = content.replace(/import ArcadeEngine from '\.\.\/components\/ArcadeEngine';\n/, '');

fs.writeFileSync('app/developermodeon/page.jsx', content);
console.log("Updated developermodeon/page.jsx");
