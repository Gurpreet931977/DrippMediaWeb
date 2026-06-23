const fs = require('fs');
let content = fs.readFileSync('app/components/ArcadeEngine.jsx', 'utf8');

// 1. Change default activeGame to 'none'
content = content.replace(
  "const [activeGame, setActiveGame] = useState('scope'); // 'dripp', 'breaker', 'scope', 'none'",
  "const [activeGame, setActiveGame] = useState('none'); // 'dripp', 'breaker', 'scope', 'none'"
);

content = content.replace(
  "const activeGameRef = useRef('dripp');",
  "const activeGameRef = useRef('none');"
);

// 2. Change let to var for arrays to prevent TDZ
content = content.replace("let scopeDrops = [];", "var scopeDrops = [];");
content = content.replace("let scopePaddle = null;", "var scopePaddle = null;");

// 3. Convert class to function constructor for ScopePaddle
content = content.replace(
  "class ScopePaddle {",
  "function ScopePaddle() {"
);
content = content.replace(
  "      constructor() {",
  ""
);
content = content.replace(
  "      update() {",
  "      }\n      ScopePaddle.prototype.update = function() {"
);
content = content.replace(
  "      draw(ctx) {",
  "      };\n      ScopePaddle.prototype.draw = function(ctx) {"
);
content = content.replace(
  "    }\n\n    class ScopeDrop {",
  "      };\n\n    function ScopeDrop() {"
);

// 4. Convert class to function constructor for ScopeDrop
content = content.replace(
  "    function ScopeDrop() {\n      constructor() {",
  "    function ScopeDrop() {"
);
content = content.replace(
  "      update(paddle) {",
  "      }\n      ScopeDrop.prototype.update = function(paddle) {"
);
content = content.replace(
  "      draw(ctx) {",
  "      };\n      ScopeDrop.prototype.draw = function(ctx) {"
);

// The end of ScopeDrop is a bit tricky, let's just use regex to replace it
content = content.replace(
  "        ctx.fill();\n      }\n    }",
  "        ctx.fill();\n      };\n"
);

fs.writeFileSync('app/components/ArcadeEngine.jsx', content);
console.log("TDZ fix applied.");
