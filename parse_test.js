const JSDOM = require("jsdom").JSDOM;
const dom = new JSDOM(`<b>Hello <i>world</i></b>`);

function parseHTMLToNotion(htmlNode) {
  const richTextArray = [];
  
  function traverse(node, currentAnnotations) {
    if (node.nodeType === 3) { // Node.TEXT_NODE
      if (node.textContent !== '') {
        richTextArray.push({
          type: 'text',
          text: { content: node.textContent },
          annotations: { ...currentAnnotations }
        });
      }
      return;
    }

    if (node.nodeType === 1) { // Node.ELEMENT_NODE
      const annotations = { ...currentAnnotations };
      const tag = node.tagName.toLowerCase();

      if (tag === 'b' || tag === 'strong') annotations.bold = true;
      if (tag === 'i' || tag === 'em') annotations.italic = true;
      if (tag === 'u') annotations.underline = true;
      if (tag === 's' || tag === 'strike' || tag === 'del') annotations.strikethrough = true;
      if (tag === 'code') annotations.code = true;

      for (const child of node.childNodes) {
        traverse(child, annotations);
      }
    }
  }

  traverse(htmlNode, {
    bold: false,
    italic: false,
    strikethrough: false,
    underline: false,
    code: false,
    color: 'default'
  });
  
  return richTextArray;
}

console.log(JSON.stringify(parseHTMLToNotion(dom.window.document.body), null, 2));
