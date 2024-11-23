"use strict";

import { parse } from "csv-parse/sync";
import fs from 'fs';
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(__dirname)
const filePath = path.join(__dirname, 'pdf', 'chubut.csv');

const columns = ['section']

let pathToCSV = path.join(filePath)
let csvString = fs.readFileSync(pathToCSV);

let rows = parse(csvString, {
    columns: true,
    skip_empty_lines: true
})
for (let i = 0; i < columns.length; i++) {
    let column = columns[i];
    let outputDir = pathToCSV.replace(/[^\/\\]+$/i, "");
    let outputFile = path.join(outputDir, `${column.replace(/\W+/ig, "-")}.txt`);
    // let outputFile = outputDir + column.replace(/\W+/ig, "-") + ".txt";
    let string = rows.map(x => x[column]).filter((c, i, a) => c && c.trim() && a.indexOf(c) === i).join("\n");
    fs.writeFileSync(outputFile, string);
    console.log(`saved unique '${column}' values to ${outputFile}`);
}



