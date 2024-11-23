"use strict";

import moment from "moment";
import { load } from "cheerio";
import url from 'url';
import querystring from 'querystring';
import fs from 'fs';
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sanitizeHtml = (x) => x;

function parsePage({ responseBody, URL, html, referer }) {
    console.log(`parsePage: parsing: ${responseBody.fileFormat} ${URL}`);
    let params = querystring.parse(URL.substring(URL.indexOf('?') + 1));
    let year = params.year || params.fromYear || null;
    year = year && parseInt(year);
    const $ = load(responseBody.content, { decodeEntities: false });
    const results = [];
    $("div#GridContainerDiv div[data-gxrow]").each(function (i) {
        let div = $(this);
        let a = div.find('a[href]').first();
        let title = a.text().replace(/\s+/g, " ").trim();
        let document_number = title.replace(/^\D*/, "");
        let URI = a.attr('href');
        URI = URI ? url.resolve(URL, URI) : null;
        let keywords = div.find('p').text().replace(/\s+/g, " ").trim();
        URI && results.push({ URI: [URI, decodeURI(URI)], title, document_number, keywords });
    });
    return results;
}

const parserTest = function () {
    const filePath = path.join(__dirname, 'pdf', 'list.html');

    let buffer = fs.readFileSync(filePath);
    buffer = parsePage({
        responseBody: { content: buffer.toString(), buffer, fileFormat: "text/html" },
        URL: "https://www.tca.gub.uy/tcawww/servlet/fallos/fallointereses?fromYear=2018&toYear=2018",
        referer: "https://www.tca.gub.uy/tcawww/servlet/fallos/fallointereses?fromYear=2018&toYear=2018",
        html: null
    });
    console.log(JSON.stringify(buffer, null, 4));
    console.log(buffer.length);
};
parserTest();
