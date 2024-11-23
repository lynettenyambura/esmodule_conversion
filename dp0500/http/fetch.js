"use strict";

import querystring from 'querystring';
import FormData from 'form-data';
import moment from 'moment';
import url from 'url';
import { load } from 'cheerio';
import fetch from 'node-fetch';
import { newPage, getBrowser } from '../../utils/crawling/PuppeteerManager.js';

import { fetchWithCookies, defaultFetchURL } from '../../utils/fetcher.js'

let map = {};

function setSharedVariable(key, value) {
    map[key] = value;
}

function getSharedVariable(key) {
    return map[key];
}

const home = async function ({ headers }) {
    let customHeaders = {
        "authority": "www.tca.gub.uy",
        "pragma": "no-cache",
        "cache-control": "no-cache",
        "dnt": "1",
        "upgrade-insecure-requests": "1",
        "sec-fetch-site": "none",
        "sec-fetch-mode": "navigate",
        "sec-fetch-dest": "document",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);

    let method = "GET";
    let requestOptions = { method, headers: _headers };
    let requestURL = 'https://www.tca.gub.uy/fallos-de-interes/';
    let responsePage = await fetchPage({ canonicalURL: requestURL, requestOptions });
    return [responsePage, await form({ headers })];
};

const form = async function ({ headers }) {
    let customHeaders = {
        "authority": "www.tca.gub.uy",
        "pragma": "no-cache",
        "cache-control": "no-cache",
        "upgrade-insecure-requests": "1",
        "dnt": "1",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "navigate",
        "sec-fetch-dest": "iframe",
        "referer": "https://www.tca.gub.uy/fallos-de-interes/",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);

    let method = "GET";
    let requestOptions = { method, headers: _headers };
    let requestURL = 'https://www.tca.gub.uy/tcawww/servlet/fallos/fallointereses';
    let responsePage = await fetchPage({ canonicalURL: requestURL, requestOptions });
    await parseForm({ responsePage });
    return responsePage;
};

const parseForm = async function ({ responsePage }) {
    let html = await responsePage.response.text();
    const $ = load(html, { decodeEntities: false });
    const form = {};
    let state = null;
    $("form").find("input, textarea, select").toArray().forEach((input, index) => {
        input = $(input);
        let name = input.attr('name');
        if (!name) return;
        let value = input.val() || "";
        if (/GridContainerDataV/i.test(name)) {
        } else if (/GXState/i.test(name)) {
            state = value;
            value = JSON.parse(value);
            for (let field in value) {
                console.log(field + " : state-field");
                if (/GridContainerData/i.test(field)) {
                    let o = JSON.parse(value[field]);
                    for (let f in o) {
                        //if f is numeric, check object Props for 2 element array with vN...f+1, and value
                        if (/^\d+$/i.test(f)) {
                            o[f].Props.forEach(ar => {
                                if (ar.length >= 2 && /^v(AN|NR)OSENTENCIA_\d+$/i.test(ar[0])) {
                                    form[ar[0]] = ar[1];
                                }
                            })
                        }
                    }
                } else if (/GX_AJAX_KEY/i.test(field)) {
                    setSharedVariable('gx-ajax=key', value[field]);
                    console.log(field, ':', value[field]);
                } else if (/AJAX_SECURITY_TOKEN/i.test(field)) {
                    setSharedVariable('ajax_security_token', value[field]);
                    console.log(field, ':', value[field]);
                } else if (/GX_AUTH_FALLOINTERESES/i.test(field)) {
                    setSharedVariable('x-gxauth-token', value[field]);
                    console.log(field, ':', value[field]);
                }
            }
        } else {
            form[name] = value;
        }
    });
    state && (form.GXState = state);
    state && setSharedVariable('form', form);
    responsePage.response = new fetch.Response(html, responsePage.response);
};

const search = async function ({ fromYear, toYear, canonicalURL, headers }) {
    let preds = await home({ headers });
    let customHeaders = {
        "authority": "www.tca.gub.uy",
        "pragma": "no-cache",
        "cache-control": "no-cache",
        "dnt": "1",
        "ajax_security_token": getSharedVariable('ajax_security_token'),
        "x-gxauth-token": getSharedVariable('x-gxauth-token'),
        "gxajaxrequest": "1",
        "content-type": "application/x-www-form-urlencoded",
        "origin": "https://www.tca.gub.uy",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.tca.gub.uy/tcawww/servlet/fallos/fallointereses",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);
    const data = getSharedVariable('form') || {};
    data["vANODESDEF"] = fromYear;
    data["vANOHASTAF"] = toYear;
    data["FILTRAR"] = `CONSULTAR`;
    let body = querystring.stringify(data);
    let method = "POST";
    let requestOptions = { method, body, headers: _headers };
    let requestURL = 'https://www.tca.gub.uy/tcawww/servlet/fallos/fallointereses'//?f274870b49a0611afc82ae779a7c7e66,gx-no-cache=1611655095383';
    let responsePage = await fetchPage({ canonicalURL, requestURL, requestOptions });
    return [responsePage, ...preds];
};


/*
doc
*/


const method3 = async function ({ argument, canonicalURL, headers }) {
    let customHeaders = {
        "authority": "www.tca.gub.uy",
        "pragma": "no-cache",
        "cache-control": "no-cache",
        "dnt": "1",
        "ajax_security_token": getSharedVariable('ajax_security_token'),
        "x-gxauth-token": getSharedVariable('x-gxauth-token'),
        "gxajaxrequest": "1",
        "content-type": "application/x-www-form-urlencoded",
        "origin": "https://www.tca.gub.uy",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.tca.gub.uy/tcawww/servlet/fallos/fallointereses",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);
    const data = {};
    let body = querystring.stringify(data);
    let method = "POST";
    let requestOptions = { method, body, headers: _headers };
    let requestURL = 'https://www.tca.gub.uy/tcawww/servlet/fallos/fallointereses'//?f274870b49a0611afc82ae779a7c7e66,gx-no-cache=1611655280367';
    let responsePage = await fetchPage({ canonicalURL, requestURL, requestOptions });
    return responsePage;
};


const method4 = async function ({ argument, canonicalURL, headers }) {
    let customHeaders = {
        "authority": "www.tca.gub.uy",
        "pragma": "no-cache",
        "cache-control": "no-cache",
        "upgrade-insecure-requests": "1",
        "dnt": "1",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "navigate",
        "sec-fetch-user": "?1",
        "sec-fetch-dest": "iframe",
        "referer": "https://www.tca.gub.uy/tcawww/servlet/fallos/fallointereses",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);

    let method = "GET";
    let requestOptions = { method, headers: _headers };
    let requestURL = 'https://www.tca.gub.uy/tcawww/PublicTempStorage/503-2020e6b372a6-4184-4bca-82a8-bcebcc785576.pdf?_blank';
    let responsePage = await fetchPage({ canonicalURL, requestURL, requestOptions });
    return responsePage;
};


async function fetchPage({ canonicalURL, requestURL, requestOptions, headers }) {
    if (!requestOptions) requestOptions = { method: "GET", headers };
    if (!canonicalURL) canonicalURL = requestURL;
    if (!requestURL) requestURL = canonicalURL;
    return await fetchWithCookies(requestURL, requestOptions)
        .then(response => {
            return {
                canonicalURL,
                request: Object.assign({ URL: requestURL }, requestOptions),
                response
            };
        });
}

const puppeteerSearch = async function ({ fromYear, toYear, canonicalURL, headers, returnPage = false }) {
    let page = await newPage();
    await page.goto("https://www.tca.gub.uy/tcawww/servlet/fallos/fallointereses", {
        waitUntil: 'networkidle2',
        timeout: 120000
    })
    await page.waitForSelector('#vANODESDEF');
    await page.$eval('#vANODESDEF', (el, startYear) => el.value = `${startYear}`, fromYear);
    await page.waitForSelector('#vANOHASTAF');
    await page.$eval('#vANOHASTAF', (el, endYear) => el.value = `${endYear}`, toYear);
    await page.click("#FILTRAR");
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(e => {
        // console.error('Network IDLE did not happen');
    });
    if (returnPage) return page;
    let html = await page.content();
    const $ = load(html, { decodeEntities: false });
    $('[data-gx-evt-control] a').each(function (i) {
        let a = $(this);
        let docTitle = a.text().replace(/\s+/g, " ").trim();
        let docURL = canonicalURL + `&documentTitle=${docTitle}`;
        a.attr('href', docURL);
    });
    return simpleResponse({
        canonicalURL,
        mimeType: "text/html",
        responseBody: $.html(),
    });
};

const clickDocument = async function ({ fromYear, toYear, documentTitle, canonicalURL, headers }) {
    let page = await puppeteerSearch({ fromYear, toYear, canonicalURL, headers, returnPage: true });
    //search for link with the said title
    console.log(`Clicking document ${documentTitle}`);
    let xPath = `//a[contains(text(), '${documentTitle}')]`;
    await page.waitForXPath(xPath);
    const elements = await page.$x(xPath);
    await page.setRequestInterception(true);
    let pdf_url = null;
    page.on('request', async (request) => {
        if (/\.(pdf|docx?|png|jpg|gif)/i.test(request.url())) {
            // console.log('Aborting request,', request.url());
            request.abort();
            if (/\.pdf\b/i.test(request.url()))
                pdf_url = request.url();
            return;
        }
        request.continue();
    });
    for (let i = 0; i < elements.length; i++) {
        let e = elements[i];
        console.log('clicking element', i);
        await e.click();
    }
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(e => {
        // console.error('Network IDLE did not happen');
    });
    if (pdf_url) {
        let responsePage = await fetchPage({ canonicalURL, requestURL: pdf_url, headers });
        return responsePage;
    } else throw ('PDF_URL not yet found');
};

async function fetchURL({ canonicalURL, headers }) {
    if (/https?:.*https?:/i.test(canonicalURL)) {
        console.error("Rejecting URL", canonicalURL, `returning [];`);
        return [];
    }
    const match = canonicalURL.match(/\?(start|from)Year=(\d{4}).(end|to)Year=(\d{4})$/i);
    const docMatch = canonicalURL.match(/\?(start|from)Year=(\d{4}).(end|to)Year=(\d{4})&documentTitle=([^&=]+)$/i);
    if (match) {
        let fromYear = parseInt(match[2]);
        let toYear = parseInt(match[4]);
        await puppeteerSearch({ fromYear, toYear, canonicalURL });
    } else if (docMatch) {
        let fromYear = parseInt(docMatch[2]);
        let toYear = parseInt(docMatch[4]);
        let documentTitle = decodeURIComponent(docMatch[5]);
        await clickDocument({ fromYear, toYear, documentTitle, headers, canonicalURL });
    } else {
        // return defaultFetchURL({canonicalURL, headers});
        throw ('UnRecogonized URL' + canonicalURL);
    }
}


(async function () {
    let canonicalURL = 'https://www.tca.gub.uy/tcawww/servlet/fallos/fallointereses?fromYear=2017&toYear=2018&documentTitle=Sentencia 152/2017';
    let headers = {};
    let res = await fetchURL({ canonicalURL, headers });
})()
