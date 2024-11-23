"use strict";

import { parse } from "csv-parse/sync";
import fs from 'fs';
import moment from "moment";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let pathToCSV = path.join(__dirname, 'pdf', 'PNG-additional-legislation-WITH-DATES.csv')


let icbgCsv = fs.readFileSync(pathToCSV);

let uriMap = parse(icbgCsv, {
    columns: true,
    skip_empty_lines: true
})

// console.log(JSON.stringify(uriMap, null, 4));

// fs.writeFileSync(__dirname + `/pdf/png.json`, JSON.stringify(uriMap, null, 4));

//count keys in map

let lookUpTable = [];
for (let i = 0; i < uriMap.length; i++) {
    let line = uriMap[i];
    if (line?.URI && line.date) {
        // let key = line.URI.replace("http://vlex.com/papua-new-guinea/legislation/","");
        let d = moment(line.date || "");
        let year = d.isValid() ? d.year() : null;
        let o = { URI: line.URI, coming_into_force_date: line.date, year }
        lookUpTable.push(o);
    }
}
console.log(JSON.stringify(lookUpTable, null, 4));

console.log(lookUpTable.length);

