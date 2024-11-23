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
    const $ = load(responseBody.content, { decodeEntities: false });
    const results = [];
    let page = $("div[data-page-no=1]").first();
    let lines = page.find('div:not(:has(div))').toArray().map(d => $(d).text().replace(/\s+/g, " ").trim()).filter(x => x);
    let spanish_date = null;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let match = /\b(\d{1,2})[ del]* ([a-z]+) [del ]*(\d{4})\b/i.exec(line);
        if (match) {
            spanish_date = `${match[1]} ${match[2]} ${match[3]}`;
            break;
        }
    }
    let d = moment(spanish_date || "", ['D MMMM YYYY'], 'es');
    let date = d.isValid() ? d.format("YYYY-MM-DD") : null;
    //
    page = $("div[data-page-no]").toArray().filter((x, i, a) => a.length - i <= 2);
    lines = [];
    page.forEach(p => {
        let ls = $(p).find('div:not(:has(div))').toArray().map(d => $(d).text().replace(/\s+/g, " ").trim()).filter(x => x);
        lines.push(...ls);
    })
    let inConsideration = [];
    for (let i = lines.length - 1; i >= 0; i--) {
        let line = lines[i];
        if (/agregado|\barch[íi1!]ves/i.test(line)) break;
        inConsideration.unshift(line);
    }
    if (inConsideration.length < 5) {

    }
    return results;
}

const parserTest = function () {
    const filePath = path.join(__dirname, 'pdf', 'pdf.html');

    let buffer = fs.readFileSync(filePath);
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
