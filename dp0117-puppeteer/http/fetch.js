"use strict";

import querystring from 'querystring';
import FormData from 'form-data';
import moment from 'moment';
import url from 'url';
import { load } from 'cheerio';
import https from 'https'
import fetch from 'node-fetch';
import { newPage, getBrowser } from '../../utils/crawling/PuppeteerManager.js';
import { fetchWithCookies, defaultFetchURL } from '../../utils/fetcher.js'



const searchDateRange = async function (from, to, canonicalURL) {
    let page = await newPage();
    await page.goto('https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/ce/index.xhtml');

}

// Immediately invoked -- causing issue

// (async () => {
//     await searchDateRange({
//         from: moment().subtract(1, 'months'),
//         to: moment(),
//         canonicalURL: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/ce/index.xhtml?from=..."
//     });
// })();

async function main() {
    await searchDateRange({
        from: moment().subtract(1, 'months'),
        to: moment(),
        canonicalURL: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/ce/index.xhtml?from=..."
    });
}

main();

//<editor-fold desc="fetchPage">
async function fetchPage({ canonicalURL, requestURL, requestOptions, headers }) {
    if (!requestOptions) requestOptions = { method: "GET", headers };
    if (!canonicalURL) canonicalURL = requestURL;
    if (!requestURL) requestURL = canonicalURL;
    if (requestURL.match(/^https/i)) {
        requestOptions.agent = new https.Agent({ rejectUnauthorized: false });
        console.log("using a custom agent");
    }
    // requestOptions.redirect = "manual";
    let responsePage = await fetchWithCookies(requestURL, requestOptions)
        .then(response => {
            return {
                canonicalURL,
                request: Object.assign({ URL: requestURL }, requestOptions),
                response
            };
        });
    return responsePage;
}
//</editor-fold>



//<editor-fold desc="downloadPDF">
const downloadPdf = async function ({ canonicalURL, headers }) {
    console.warn(`downloadPdf() To download: ${canonicalURL}`);
    let customHeaders = {
        "Upgrade-Insecure-Requests": "1",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);

    let method = "GET";
    let requestOptions = { method, headers: _headers };
    let responsePage = await fetchPage({ canonicalURL, requestOptions });
    let type = responsePage.response.headers.get('content-type');
    type && console.log(`TYPE = ${type}`);
    if (responsePage.response.ok && /pdf|word/i.test(type)) {
        let contentSize = parseInt(responsePage.response.headers.get('content-length') || "-1");
        let buffer = await responsePage.response.buffer();
        let bufferLength = buffer.length;
        if (contentSize < 0 || bufferLength === contentSize) {
            responsePage.response = new fetch.Response(buffer, responsePage.response);
            console.warn(`downloadPdf() Downloaded: ${canonicalURL}`);
        } else {
            responsePage.response.ok = false;
            responsePage.response.status = 502;
            responsePage.response.statusText = `incomplete ${type} document download: ${contentSize} > ${bufferLength}\n`.toUpperCase();
            responsePage.response = new fetch.Response(responsePage.response.statusText, responsePage.response);
        }
    } else {
        responsePage.response.ok = false;
        responsePage.response.statusText = `either not pdf, or request did not succeed: ${responsePage.response.status} && ${type}\n`.toUpperCase();
        responsePage.response.status = 502;
        responsePage.response = new fetch.Response(responsePage.response.statusText, responsePage.response);
    }
    return responsePage;
}
//</editor-fold>

//<editor-fold desc="fetchURL">
async function fetchURL({ canonicalURL, headers }) {
    if (/https?:.*https?:/i.test(canonicalURL)) {
        console.error("Rejecting URL", canonicalURL, `returning [];`);
        return [];
    }

    console.log(`INFO: In fetchURL() - canonical URL: ${canonicalURL}`);

    const match = canonicalURL.match(/start=([0-9]{4}-[0-9]{2}-[0-9]{2}).end=([0-9]{4}-[0-9]{2}-[0-9]{2})$/);
    const matchDay = canonicalURL.match(/date=([0-9]{4}-[0-9]{2}-[0-9]{2})$/);
    const matchDayEditor = canonicalURL.match(/date=([0-9]{4}-[0-9]{2}-[0-9]{2}).editor=([0-9a-zA-Z]+)$/i);
    const matchDayJudgingBody = canonicalURL.match(/date=([0-9]{4}-[0-9]{2}-[0-9]{2}).judging_body=([0-9]+)$/i);

    if (match) {
        let start = match[1];
        let end = match[2];

        return [await inspectPage(canonicalURL, start, end)];
    } else if (matchDay) {
        let search_date = matchDay[1];

        return await processPageByEditor({ canonicalURL, search_date });

    } else if (matchDayEditor) {
        let search_date = matchDayEditor[1];
        let editor = matchDayEditor[2];

        console.log(`INFO: matchDayEditor - ${canonicalURL}`)
        return await processPageByEditor({ canonicalURL, search_date, editor });
    } else if (matchDayJudgingBody) {
        let search_date = matchDayJudgingBody[1];
        let judging_body = matchDayJudgingBody[2];

        console.log(`INFO: matchDayJudgingBody - ${canonicalURL}`)
        return await processPageByJudgingBody({ canonicalURL, search_date, judging_body });

    } else if (/\.(pdf|docx?)\b/i.test(canonicalURL)) {
        return [await downloadPdf({ canonicalURL, headers })];
    } else {
        return [await fetchPage({ canonicalURL, headers })];
    }

}
//</editor-fold>

async function runFetch() {
    const canonicalURL = 'https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/ce/index.xhtml';
    const headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html"
    };

    let response = await fetchURL({ canonicalURL, headers });

    if (response && response[0] && response[0].response) {
        const contentType = response[0].response.headers.get("Content-Type");

        if (contentType && contentType.includes('text/html')) {
            const htmlContent = await response[0].response.text();
            const fs = await import('fs');
            fs.writeFileSync('response.html', htmlContent);
            console.log('HTML response saved to response.html');
        } else {
            console.log('Non-HTML response:', await response[0].response.text());
        }
    } else {
        console.log('Error: No response received.');
    }
}

runFetch(); 