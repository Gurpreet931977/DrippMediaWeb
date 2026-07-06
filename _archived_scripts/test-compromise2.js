const nlp = require('compromise');
const text = "Just got off the phone with Acme Corp. The client is John Doe, his email is john@acme.com and his number is 555-0199. We need to do a Website Redesign for $1500 and Monthly SEO for 500 USD.";
const doc = nlp(text);

const items = [];
doc.sentences().forEach(s => {
   const money = s.money().out('array');
   if (money.length > 0) {
      // If there are multiple prices in a sentence, we might have multiple items
      // Let's split the sentence by 'and' or commas if there are multiple prices
      let parts = [s.text()];
      if (money.length > 1) {
          parts = s.text().split(/and|,/i);
      }
      
      parts.forEach(part => {
          const pDoc = nlp(part);
          const pMoney = pDoc.money().out('array');
          if (pMoney.length > 0) {
              const rateStr = pMoney[0];
              const rate = parseFloat(rateStr.replace(/[^0-9.]/g, ''));
              let desc = part.replace(rateStr, '').replace(/for|at|costing|USD|EUR|GBP|INR|\$/gi, '').trim();
              desc = desc.replace(/we need to do a/i, '').replace(/we need/i, '').trim();
              items.push({ desc, rate });
          }
      });
   }
});
console.log(items);
