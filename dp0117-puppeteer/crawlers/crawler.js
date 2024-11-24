"use strict";

// const moment = require("moment");
// const url = require("url");
// const querystring = require("querystring");
// const cheerio = require("cheerio");
// const fs = require("fs");

// const { fetchWithCookies } = require("../../utils/fetcher");
// const puppeteerManager = require("../../utils/PuppeteerManager");
import moment from "moment";
import url from "url";
import querystring from "querystring";
import cheerio from "cheerio";
import fs from "fs";

import { fetchWithCookies } from "../../utils/fetcher.js";
import puppeteerManager from "../../utils/PuppeteerManager.js";



const BASE_URL = 'https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/ce/index.xhtml';
const TIMEOUT = 30000;
const NAVIGATION_WAIT = 2000;
const PAGINATION_WAIT = 5000;
const PAGINATION_PAUSE = 2000;
const PAGINATION_LIMIT = 100;
const DIVISION_LIMIT = 3;


//<editor-fold desc="fetchPage">
async function fetchPage({ canonicalURL, requestURL, requestOptions, headers }) {
    if (!requestOptions) requestOptions = { method: "GET", headers };
    if (!canonicalURL) canonicalURL = requestURL;
    if (!requestURL) requestURL = canonicalURL;
    if (requestURL.match(/^https/i)) {
        requestOptions.agent = new https.Agent({ rejectUnauthorized: false });
        console.log("using a custom agent");
    }
    // requestOptions.redirect = "manual";;
    let responsePage = await fetchWithCookies(requestURL, requestOptions, "zone-g1-country-co")
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


const divideAndConquer = async function ({ canonicalURL, start, stop }) {
    const page = await getNewPuppeteerPage();

    let noResults = await search({ page, start, stop });
    if (noResults) {
        // Return no results for date range
        return [];
    }

    // Ensure that the content page has loaded with this check
    await page.waitForXPath('//b[starts-with(text(), "NR")]',
        { visible: true, timeout: TIMEOUT })
        .then(() => console.log(moment().toISOString() + ` :Results page loaded`));
    console.log(moment().toISOString() + ": xpath wait completed")

    // Plug-in HTML and DOC url
    const html = await page.content();
    const $ = cheerio.load(html);

    const nr = $("[color]:contains('NR:')").next().text();
    console.log(moment().toISOString() + `: nr: ${nr}`);

    // find the range
    const startDate = moment(start);
    const stopDate = moment(stop);

    const range = stopDate.diff(startDate, 'days')

    const { actual_total } = await getTotalNumberOfPages({ page });

    if ((actual_total > PAGINATION_LIMIT) && (range > 1)) {


        let htmlPage = `<html lang="en"><head><title>Injected Links</title></head><body><div id="injectedLinks"><ol>`;

        if (range <= DIVISION_LIMIT) {

            for (let day = startDate; day.isSameOrBefore(stopDate); day.add(1, 'days')) {
                const link = `${BASE_URL}?start=${day.format('YYYY-MM-DD')}&stop=${day.format('YYYY-MM-DD')}`;
                const li = `<li><a href="${link}">${link}</a></li>`;
                htmlPage += li;
            }

        } else {
            const mid_range = Math.floor((range + 1) / 2);
            const lower_bound = moment(start).add(mid_range, 'days');
            const upper_bound_start = moment(start).add(mid_range + 1, 'days');

            // Inject URLs with a smaller date range

            const lower_range_link = `${BASE_URL}?start=${start}&stop=${lower_bound.format('YYYY-MM-DD')}`;
            const li_lower = `<li><a href="${lower_range_link}">${lower_range_link}</a></li>`;
            htmlPage += li_lower;

            const higher_range_link = `${BASE_URL}?start=${upper_bound_start.format('YYYY-MM-DD')}&stop=${stop}`;
            const li_higher = `<li><a href="${higher_range_link}">${higher_range_link}</a></li>`;
            htmlPage += li_higher;
        }

        htmlPage += `</ol></body></html>`;

        const response = simpleResponse({
            canonicalURL,
            mimeType: 'text/html',
            responseBody: htmlPage
        });

        return [response];
    } else {
        return await searchByDateRange({ start, stop });
    }

}

async function searchByDateRange({ start, stop }) {
    const page = await getNewPuppeteerPage();
    let responses = [];

    let noResults = await search({ page, start, stop });
    if (noResults) {
        // Return no results for date
        return [];
    }

    // Ensure that the content page has loaded with this check
    await page.waitForXPath('//b[starts-with(text(), "NR")]',
        { visible: true, timeout: TIMEOUT })
        .then(() => console.log(moment().toISOString() + ` :Results page loaded`));
    console.log(moment().toISOString() + ": xpath wait completed")

    // Plug-in HTML and DOC url
    const html = await page.content();
    const $ = cheerio.load(html);

    let nr = $("[color]:contains('NR:')").next().text();
    let dateString = $("[color]:contains('FECHA')").next().text();
    const fecha = getFormattedDate(dateString, "DD/MM/YYYY", "en");
    console.log(moment().toISOString() + `: nr: ${nr}`);


    const { actual_total, display_total } = await getTotalNumberOfPages({ page });
    let current_page = 1;

    // handle pagination
    const results = await handlePagination({ page, $, start, stop, nr, fecha, current_page, actual_total, display_total });
    responses = [...results];

    // await page.browser().close();
    return responses;
}


async function handlePagination({ page, $, start, stop, nr, fecha, current_page, actual_total, display_total }) {
    const results = [];
    let has_results = true;
    const nrs = new Set();
    let pageDate = fecha;

    while (current_page <= actual_total) {

        if (has_results) {
            if (nrs.has(nr))
                throw new Error(`Duplicate nr ${nr} on page ${current_page} between ${start} and ${stop}`);
            else
                nrs.add(nr);

            // Wrap elements with anchor tags
            const html_link = `https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/FileReferenceServlet?corp=ce&ext=html&file=${nr}`;
            const word_link = `https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/FileReferenceServlet?corp=ce&ext=doc&file=${nr}`;

            console.log(`HTML LINK: ${html_link}`);
            console.log(`WORD LINK: ${word_link}`);

            $('.ui-button-icon-left.ui-icon.ui-c.wordIcon').wrap(`<a href="${word_link}"></a>`);
            $('.ui-button-icon-left.ui-icon.ui-c.htmlIcon').wrap(`<a href="${html_link}"></a>`);

            // Push into array
            let page_body = simpleResponse({
                canonicalURL: `${BASE_URL}?date=${pageDate}&nr=${nr}&page=${current_page}`,
                mimeType: "text/html",
                responseBody: $.html(),
            });

            results.push(page_body);
        } else {
            // reset back to true
            has_results = true;
        }


        // Small break
        await page.waitForTimeout(PAGINATION_PAUSE);

        if (current_page < actual_total) {

            // Click on Next page
            await page.click("#resultForm\\:j_idt145", {
                waitUntil: 'load',
                timeout: PAGINATION_WAIT
            });

            // Wait for page to load
            await page.waitForXPath(`//span[contains(text(), 'Resultado: ${++current_page} / ${display_total}')]`, { timeout: PAGINATION_WAIT })
                .then(() => console.log(`${moment().toISOString()} : Page ${current_page} loaded`))
                .catch(err => {
                    has_results = false;
                    console.log(`${moment().toISOString()} : ERROR: Page ${current_page} not loaded/ does not exist`);
                }
                );

            // Load new content for the next page
            const html = await page.content();
            $ = cheerio.load(html);

            // fetch nr
            nr = $("[color]:contains('NR:')").next().text();
            let dateString = $("[color]:contains('FECHA')").next().text();
            pageDate = getFormattedDate(dateString, "DD/MM/YYYY", "en");
        } else {
            break;
        }

    }

    return results;
}


//<editor-fold desc="Convenience functions">
const getNewPuppeteerPage = async function () {
    return await puppeteerManager.newPage({
        incognito: true,
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36'
    });
}

const getTotalNumberOfPages = async function ({ page }) {

    // Go to the last page
    await page.click("#resultForm\\:j_idt146")
        .then(() => console.log(moment().toISOString() + ': Going to last page'));

    await page.waitForTimeout(NAVIGATION_WAIT)
        .then(() => console.log(moment().toISOString() + ` : Last page loaded`));


    const html = await page.content();
    const $ = cheerio.load(html);

    const resultado = $("span[id$='pagText2']").text();
    console.log(moment().toISOString() + `: Resultado text: \n${resultado}`);

    const match_resultado = resultado.match(/Resultado:\s*(\d+)\s*\/\s*(\d+)/i);

    // Go back to the first page
    await page.click("#resultForm\\:j_idt143")
        .then(() => console.log(moment().toISOString() + ': Going back to the first page'));

    // Ensure that the content page has loaded with this check
    await page.waitForTimeout(NAVIGATION_WAIT)
        .then(() => console.log(moment().toISOString() + ` : First page reloaded`));

    if (match_resultado) {
        let actual_total = parseInt(match_resultado[1]);
        const display_total = parseInt(match_resultado[2]);

        actual_total = actual_total < 2 ? display_total : actual_total;

        console.log(` Actual total: ${actual_total} / Displayed total: ${display_total}`);

        return { actual_total, display_total };
    } else {
        throw new Error('ERROR: Could not get number of pages')
    }
}

async function search({ page, start, stop }) {
    let noResults = false;
    const startDate = moment(start);
    const stopDate = moment(stop);

    if (startDate.isAfter(stopDate)) {
        noResults = true;
        return noResults;
    }

    // Go to home page
    await page.goto('https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/ce/index.xhtml', {
        waitUntil: 'load',
        timeout: TIMEOUT
    })
        .then(() => console.log(moment().toISOString() + ': Home page loaded!'))
        .catch((err) => {
            throw (moment().toISOString() + ': Home page NOT loaded!\n' + err);

        });


    // Enter date range
    const startDateString = startDate.format('DD/MM/YY');
    const stopDateString = stopDate.format('DD/MM/YY');
    await page.$eval('#searchForm\\:fechaIniCal_input', (el, value) => el.value = value, startDateString);
    await page.$eval('#searchForm\\:fechaFinCal_input', (el, value) => el.value = value, stopDateString);

    // Click on search
    await page.click("#searchForm\\:j_idt61")
        .then(() => console.log(moment().toISOString() + ': Clicked on search and load started'))

    // Check for the "no results found" message if no results are found
    console.log(moment().toISOString() + ": waiting for xpath")

    await page.waitForXPath('//div[@id="mainFormCE:dialogMess"]',
        { visible: true, timeout: TIMEOUT })
        .then(() => {
            console.log(moment().toISOString() + `: No results message detected`);
            noResults = true;
        })
        .catch(err => console.error(moment().toISOString() + `: WARNING: No results message timeout`)); // This is normal when results are found, we want this error ignored

    return noResults;
}

function getFormattedDate(dateString, formatString, locale) {
    moment.locale(locale);
    let momentDate = new moment(dateString, formatString, true);
    return momentDate.isValid() ? momentDate.format("YYYY-MM-DD") : "";
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
    if (responsePage.response.ok && /pdf|word|htm/i.test(type)) {
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
    console.log(`INFO: In fetchURL() - canonical URL: ${canonicalURL}`);

    if (/localhost/i.test(canonicalURL)) {
        return [];
    }

    const match = canonicalURL.match(/start=([0-9]{4}-[0-9]{2}-[0-9]{2}).stop=([0-9]{4}-[0-9]{2}-[0-9]{2})$/);

    if (match) {
        const start = match[1];
        const stop = match[2];

        return await divideAndConquer({ canonicalURL, start, stop });
    } else if (/\?corp=ce.ext=doc.file=.+/i.test(canonicalURL) || /\?corp=ce.ext=pdf.file=.+/i.test(canonicalURL)) {
        return [await downloadPdf({ canonicalURL, headers })];
    } else if (/\?corp=ce.ext=html.file=.+/i.test(canonicalURL)) {
        return [await fetchPage({ canonicalURL, headers })];
    }

    console.error(`UNKNOWN URL: ${canonicalURL}`);

}
//</editor-fold>



//<editor-fold desc="DO NOT SHIP THIS TO ICEBERG">
function simpleResponse({ canonicalURL, mimeType, responseBody }) {
    console.log(`Saved ${canonicalURL}`);
    return { canonicalURL, mimeType, responseBody };
}

function timestamp() {
    return Math.round(new Date().getTime() / 1000);
}

(async () => {
    const canonicalURL = 'https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/ce/index.xhtml?start=2019-01-01&stop=2019-12-31';
    const responses = await fetchURL({ canonicalURL, headers: {} });

    console.log('Got ' + responses.length + ' page(s)');


    for (let i = 0; i < responses.length; i++) {
        const html = responses[i].responseBody;

        fs.writeFileSync(`../files/results_${timestamp()}_${i + 1}.html`, html);
    }
})();
//</editor-fold>
