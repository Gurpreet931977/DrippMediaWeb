const fs = require('fs');
let content = fs.readFileSync('app/components/ArcadeEngine.jsx', 'utf8');

// Replace class ScopePaddle { ... }
let replacedPaddle = content.replace(
  /class ScopePaddle \{\s*constructor\(\) \{([\s\S]*?)\}\s*update\(\) \{([\s\S]*?)\}\s*draw\(ctx\) \{([\s\S]*?)\}\s*\}/,
  function(match, constructorBody, updateBody, drawBody) {
    return `function ScopePaddle() {${constructorBody}}\nScopePaddle.prototype.update = function() {${updateBody}};\nScopePaddle.prototype.draw = function(ctx) {${drawBody}};`;
  }
);

// Replace class ScopeDrop { ... }
let replacedDrop = replacedPaddle.replace(
  /class ScopeDrop \{\s*constructor\(\) \{([\s\S]*?)\}\s*update\(paddle\) \{([\s\S]*?)\}\s*draw\(ctx\) \{([\s\S]*?)\}\s*\}/,
  function(match, constructorBody, updateBody, drawBody) {
    return `function ScopeDrop() {${constructorBody}}\nScopeDrop.prototype.update = function(paddle) {${updateBody}};\nScopeDrop.prototype.draw = function(ctx) {${drawBody}};`;
  }
);

fs.writeFileSync('app/components/ArcadeEngine.jsx', replacedDrop);
console.log("Classes replaced.");
