"use strict";

import fs from 'fs'

let content = fs.readFileSync("./pdf/maintenance.txt").toString().toLowerCase().replace(/,/g, "").split(/\s+/);
content = content.filter((x, i) => content.indexOf(x) === i && x.trim()).map(x => /^dp/i.test(x) ? x : x.toUpperCase()).sort();
let _5ves = "";

content.forEach((p, i) => {
    _5ves += p + "," + (i % 5 === 4 ? "\n" : " ");
    i && i % 119 === 0 && (_5ves += "\n");
});


console.log(_5ves.replace(/,\s*$/, ""));
console.log(content.length);
//
// console.log(JSON.stringify(content, null, 4));
