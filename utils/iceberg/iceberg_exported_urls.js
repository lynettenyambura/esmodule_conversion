"use strict";

import moment from "moment";
import { load } from "cheerio";
import url from 'url';
import querystring from 'querystring'
import fs from 'fs';
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sanitizeHtml = (x) => x;

function parsePage({ responseBody, URL, html, referer }) {
    console.log(`parsePage: parsing: ${responseBody.fileFormat} ${URL}`);
    let object = JSON.parse(responseBody.content);

    const results = [];
    object && object.data && object.data.viewer && object.data.viewer.records
        && object.data.viewer.records.edges && object.data.viewer.records.edges.forEach(o => {
            o && o.node && o.node.uris && o.node.uris.forEach(u => {
                // /\.(pdf|docx?)/i.test(u) &&
                console.log(u);
            });
        })
    return results;
}

const parserTest = function () {
    const filePath = path.join(__dirname, 'pdf', 'iceberg_urls.json');

    let buffer = fs.readFileSync(filePath)

    buffer = parsePage({
        responseBody: { content: buffer.toString(), buffer, fileFormat: "text/html" },
        URL: "",
        referer: "",
        html: null
    });
    console.log(JSON.stringify(buffer, null, 4));
    console.log(buffer.length);
};
parserTest();
