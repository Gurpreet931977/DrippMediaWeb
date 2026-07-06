const nlp = require('compromise');
const text = "Just got off the phone with Acme Corp. The client is John Doe, his email is john@acme.com and his number is 555-0199. We need to do a Website Redesign for $1500 and Monthly SEO for 500 USD.";
const doc = nlp(text);

console.log("People:", doc.people().out('array'));
console.log("Organizations:", doc.organizations().out('array'));
console.log("Money:", doc.money().out('array'));
console.log("Numbers:", doc.numbers().out('array'));
