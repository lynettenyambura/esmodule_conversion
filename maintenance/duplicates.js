"use strict";

import * as fs from "fs";


let lines = fs.readFileSync("./check_dups.txt").toString().split(/\s*\n\s*/g).filter(c => c);
let repeated = lines.filter((c, i, a) => a.indexOf(c) !== i);
let unique = lines.filter((c, i, a) => a.indexOf(c) === i);
repeated.forEach(a => console.log(a));
console.log(`total lines: ${lines.length}`);
console.log(`repeated lines: ${repeated.length}`);
console.log(`unique lines: ${unique.length}`);


