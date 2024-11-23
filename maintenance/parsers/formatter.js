"use strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// // directory name for __dirname equivalent in ES modules


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Construct the path to the "projects.txt" file
const filePath = path.join(__dirname, 'pdf', 'projects.txt');
let projectList = (fs.readFileSync(filePath).toString().toLowerCase()).split(/\s*[\n\s,]+\s*/g).filter((c, i, a) => {
    let f = c && a.indexOf(c) === i;
    if (!f) console.log(c, i);
    return f;
}).map(x => x.toLowerCase()).sort();
// console.log(JSON.stringify(projectList, null, 4));
let text = [];
let inner = [];
for (let i = 0; i < projectList.length; i++) {
    let project = projectList[i];
    inner.push(project + ',');
    if (projectList.length - 1 === i || i % 5 === 4) {
        text.push(inner);
        inner = [];
    }
    ///not else
    if (i % 120 === 119)
        text.push([]);
}

let form = text.map(line => {
    line = line.join(" ")
    if (line.length >= 40)
        line = line.replace(/\s+/gi, "")
    return line;
});
form.forEach(line => console.log(line));
console.log(projectList.length);
