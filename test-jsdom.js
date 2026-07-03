const { JSDOM } = require('jsdom');
JSDOM.fromURL("http://localhost:3000/developermodeon", {
  runScripts: "dangerously",
  resources: "usable"
}).then(dom => {
  dom.window.onerror = function(msg, source, line, col, error) {
    console.log("JSDOM Error:", msg);
  };
  setTimeout(() => {
    console.log("JSDOM HTML length:", dom.serialize().length);
    process.exit(0);
  }, 3000);
}).catch(e => console.log("JSDOM Failed:", e));
