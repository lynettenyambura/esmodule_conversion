"use strict";

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataFilePath = path.join(__dirname, 'pdf', 'data.json');
const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

const edges = data && data.data && data.data.viewer && data.data.viewer.records && data.data.viewer.records.edges && data.data.viewer.records.edges;
let anchors = [];
let ids = [];
edges.forEach(edge => {
    let docURLs = edge.node.uris;
    docURLs.forEach(u => {
        let match = /id=(\w+)/i.exec(u);
        match && ids.push(match[1])
    })
    docURLs = docURLs.filter(x => /\.(pdf|docx?)|Descarga/i.test(x))
        .map((x, i) => ` <a href="${x}">${(anchors.length + i + 1)}</a> ${((anchors.length + i) && (anchors.length + i) % 25 === 0) ? "<br/>" : ""}`)
    anchors.push(...docURLs)

})
let html = `<html lang="en"><body><h1>Content Links</h1><div id="custom-links">\n${anchors.join("\n")}\n</div></body></html>`;

fs.writeFileSync(path.join(__dirname, 'pdf', 'data.html'), html);

fs.writeFileSync(path.join(__dirname, 'pdf', 'ids.txt'), `https://normasapf\.funcionpublica\.gob\.mx//NORMASAPF/Descarga\?id=(${ids.join("|")})`);

