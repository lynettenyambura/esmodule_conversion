"use strict";

import moment from "moment";
import { load } from "cheerio";
import url from 'url';
import querystring from 'querystring';
import fs from 'fs'
import path from 'path';
import { fileURLToPath } from "url";
import { dirname } from "path";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sanitizeHtml = (x) => x;

function parsePage({ responseBody, URL, html, referer }) {
    console.log(`parsePage: parsing: ${responseBody.fileFormat} ${URL}`);
    let j = JSON.parse(responseBody.content);
    j && j.data && j.data.viewer && j.data.viewer.records && j.data.viewer.records.edges && j.data.viewer.records.edges.forEach(e => {
        let _uri = e.node && e.node.URI && e.node.URI.length && e.node.URI[0].repr;
        _uri && console.log(_uri);
        !_uri && e.node && e.node.uris && e.node.uris.forEach(u => console.log(u));
    });
    return [];
}

const parserTest = function () {
    const filePath = path.join(__dirname, 'pdf', 'no-content.json');


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
