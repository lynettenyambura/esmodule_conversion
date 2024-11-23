"use strict";


import { parse } from "csv-parse/sync";
import fs from 'fs';
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let pathToCSV = path.join(__dirname, 'pdf', 'png.csv')
let icbgCsv = fs.readFileSync(pathToCSV);

let uriMap = parse(icbgCsv, {
    columns: true,
    skip_empty_lines: true
}).reduce((acc, x) => {
    if (!acc[x.URI]) {
        acc[x.URI] = [];
    }
    acc[x.URI].push(x.URL);
    return acc;
}, {});

// console.log(JSON.stringify(uriMap, null, 4));

// fs.writeFileSync(__dirname + `/pdf/png.json`, JSON.stringify(uriMap, null, 4));

//count keys in map

let count = 0;
let problematic = {}
for (let key in uriMap) {
    count++;
    if (uriMap[key].length > 2) {
        problematic[key] = uriMap[key];
    } else if (uriMap[key].length === 2) {
        if (/pg_upd/i.test(uriMap[key][0]) && /pg_upd/i.test(uriMap[key][1]) || /pg_cases/i.test(uriMap[key][0]) && /pg_cases/i.test(uriMap[key][1])) {
            problematic[key] = uriMap[key];
        }
    }
}

console.log("total:", count);
console.log(JSON.stringify(problematic, null, 4));

fs.writeFileSync(path.join(__dirname, 'pdf', 'problematic.json'), JSON.stringify(problematic, null, 4));

