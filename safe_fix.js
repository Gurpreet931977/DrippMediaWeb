const fs = require('fs');
let content = fs.readFileSync('app/components/ArcadeEngine.jsx', 'utf8');

content = content.replace(
  "const [activeGame, setActiveGame] = useState('scope');",
  "const [activeGame, setActiveGame] = useState('none');"
);

content = content.replace(
  "const activeGameRef = useRef('dripp');",
  "const activeGameRef = useRef('none');"
);

fs.writeFileSync('app/components/ArcadeEngine.jsx', content);
console.log("Safe fix applied.");
