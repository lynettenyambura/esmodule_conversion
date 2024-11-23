"use strict";

import moment from "moment";
import { load } from "cheerio";
import url from 'url';
import querystring from 'querystring';
import fs from 'fs'
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sanitizeHtml = (x) => x;

function parsePage({ responseBody, URL, html, referer }) {
    console.log(`parsePage: parsing: ${responseBody.fileFormat} ${URL}`);
    let urls = responseBody.content.toString().split(/\s*\n\s*/g)
        .filter(x => x && x.trim())
        .map(_u => _u.replace(/.*\?/, ""))
        .map(l => querystring.parse(l.substring(l.indexOf('?') + 1)));
    let parameters = {};
    urls.forEach(d => {
        for (let dd in d) {
            parameters[dd] = true;
        }
    });
    for (let header in parameters) {
        let isDifferent = false;
        let currentVal = null;
        urls.forEach((p, i) => {
            if (i === 0) currentVal = p[header];
            else {
                isDifferent = isDifferent || p[header] !== currentVal;
            }
        });
        if (!isDifferent) {
            delete parameters[header];
        }
    }
    console.log(JSON.stringify(parameters, null, 4));
    let x = {};
    for (let param in parameters) {
        let values = [];
        urls.forEach(o => {
            values.push(o[param]);
        });
        x[param] = values;
    }
    return [x];
}

const parserTest = function () {

    const filePath = path.join(__dirname, 'pdf', 'url-compare.txt');

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
