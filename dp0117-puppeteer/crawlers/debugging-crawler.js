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


/**
 * THIS CRAWLER IS ONLY FOR DEBUGGING ON ICEBERG!
 *
 */


const BASE_URL = 'https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/ce/index.xhtml';
const TIMEOUT = 30000;
const PAGINATION_LIMIT = 300;
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
    // requestOptions.redirect = "manual";
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
    const page = await puppeteerManager.newPage();

    let noResults = await search({ page, start, stop });
    const html = await page.content();
    const response = simpleResponse({
        canonicalURL,
        mimeType: 'text/html',
        responseBody: html
    });

    return [response];

    /*if ( noResults ){
        // Return no results for date range
        return [];
    }
    
    // Ensure that the content page has loaded with this check
    await page.waitForXPath('//b[starts-with(text(), "NR")]',
        {visible:true, timeout: TIMEOUT})
        .then(()=>console.log(moment().toISOString() + ` :Results page loaded`));
    console.log(moment().toISOString() + ": xpath wait completed")
    
    // Plug-in HTML and DOC url
    const html = await page.content();
    const $ = cheerio.load(html);
    
    const nr = $("[color]:contains('NR:')").next().text();
    console.log(moment().toISOString() + `: nr: ${nr}`);
    
    // find the mid-point
    const startDate = moment(start);
    const stopDate = moment(stop);
    
    const startDay = startDate.date();
    const stopDay = stopDate.date();
    
    const range = stopDay - startDay;
    const { total_pages } = getNumberOfPages({$});
    if ( total_pages > PAGINATION_LIMIT && range > 1 ) {
    
    
        let htmlPage = `<html lang="en"><head><title>Injected Links</title></head><body><div id="injectedLinks"><ol>`;
        
        if ( range <= DIVISION_LIMIT ) {
            
            for ( let day = startDate; day.isSameOrBefore(stopDate); day.add(1, 'days') ) {
                const link = `${BASE_URL}?start=${day.format('YYYY-MM-DD')}&stop=${day.format('YYYY-MM-DD')}`;
                const li = `<li><a href="${link}">${link}</a></li>`;
                htmlPage += li;
            }
            
        } else {
            const mid_point = Math.floor( (range  + 1 ) / 2);
            const lower_bound = moment(start).day(mid_point);
            const upper_bound_start = moment(start).day(mid_point + 1);
    
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
    
        return [ response ];
    } else {
        return await searchByDateRange({start, stop});
    }*/

}

async function searchByDateRange({ start, stop }) {
    const page = await puppeteerManager.newPage();
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

    const nr = $("[color]:contains('NR:')").next().text();
    console.log(moment().toISOString() + `: nr: ${nr}`);


    let { current_page, total_pages } = getNumberOfPages({ $ });

    // handle pagination
    const results = await handlePagination({ page, $, start, stop, nr, current_page, total_pages });
    responses = [...results];

    // await page.browser().close();
    return responses;
}


async function handlePagination({ page, $, start, stop, nr, current_page, total_pages }) {
    const results = [];
    let has_results = true;

    while (current_page <= total_pages) {

        // Wrap elements with anchor tags
        const html_link = `https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/FileReferenceServlet?corp=ce&ext=html&file=${nr}`;
        const word_link = `https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/FileReferenceServlet?corp=ce&ext=doc&file=${nr}`;

        $('.ui-button-icon-left.ui-icon.ui-c.wordIcon').wrap(`<a href="${word_link}"></a>`);
        $('.ui-button-icon-left.ui-icon.ui-c.htmlIcon').wrap(`<a href="${html_link}"></a>`);

        // Push into array
        let page_body = simpleResponse({
            canonicalURL: `${BASE_URL}?start=${start}&stop=${stop}&nr=${nr}&page=${current_page}`,
            mimeType: "text/html",
            responseBody: $.html(),
        });

        if (has_results) {
            results.push(page_body);
        } else {
            // reset back to true
            has_results = true;
        }


        // Small break
        await page.waitForTimeout(1000);

        if (current_page < total_pages) {

            // Click on Next page
            await page.click("#resultForm\\:j_idt145", {
                waitUntil: 'load',
                timeout: TIMEOUT
            });

            // Wait for page to load
            await page.waitForXPath(`//span[contains(text(), 'Resultado: ${++current_page} / ${total_pages}')]`)
                .then(() => console.log(`${moment().toISOString()} : Page ${current_page} loaded`))
                .catch(err => {
                    has_results = false;
                    console.log(`${moment().toISOString()} : ERROR: Page ${current_page} not loaded/ does not exist`, err);
                }
                );

            // Load new content for the next page
            const html = await page.content();
            $ = cheerio.load(html);
        } else {
            break;
        }

    }

    return results;
}


//<editor-fold desc="Convenience functions">
const getNumberOfPages = function ({ $ }) {
    const resultado = $("span[id$='pagText2']").text();
    console.log(moment().toISOString() + `: Resultado text: \n${resultado}`);

    const match_resultado = resultado.match(/Resultado:\s*(\d+)\s*\/\s*(\d+)/i);
    if (match_resultado) {
        let current_page = parseInt(match_resultado[1]);
        const total_pages = parseInt(match_resultado[2]);

        console.log(`${current_page} / ${total_pages}`);

        return { current_page, total_pages };
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
    }).catch((err) => {
        console.error("ERROR: Home Page did not load.", err);
    });

    // Enter date range
    const startDateString = startDate.format('DD/MM/YY');
    const stopDateString = stopDate.format('DD/MM/YY');
    /*await page.$eval('#searchForm\\:fechaIniCal_input', (el, value) => el.value = value, startDateString);
    await page.$eval('#searchForm\\:fechaFinCal_input', (el, value) => el.value = value, stopDateString);
    
    // Click on search
    await page.click("#searchForm\\:j_idt61")
        .then(() => console.log(moment().toISOString() + ': Clicked on search and load started'))
    
    // Check for the "no results found" message if no results are found
    console.log(moment().toISOString() + ": waiting for xpath")
    
    await page.waitForXPath('//div[@id="mainFormCE:dialogMess"]',
        {visible: true, timeout: TIMEOUT})
        .then(() => {
            console.log(moment().toISOString() + `: No results message detected`);
            noResults = true;
        })
        .catch(err => console.error(moment().toISOString() + `: WARNING: No results message timeout`)); // This is normal when results are found, we want this error ignored*/
    return noResults;
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
    console.log(`INFO: In fetchURL() - canonical URL: ${canonicalURL}`);

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

    throw new Error(`UNKNOWN URL: ${canonicalURL}`);

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
    const canonicalURL = 'https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/ce/index.xhtml?start=2020-10-01&stop=2020-10-31';
    const responses = await fetchURL({ canonicalURL, headers: {} });

    console.log('Got ' + responses.length + ' page(s)');


    for (let i = 0; i < responses.length; i++) {
        const html = responses[i].responseBody;

        fs.writeFileSync(`../files/results_${timestamp()}_${i + 1}.html`, html);
    }
})();
//</editor-fold>
