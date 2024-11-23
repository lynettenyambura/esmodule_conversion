"use strict";

import querystring from 'querystring';
import FormData from 'form-data';
import moment from 'moment';
import url from 'url';
import { load } from 'cheerio';
import fetch from 'node-fetch';

import { fetchWithCookies, defaultFetchURL } from '../../utils/fetcher';


// let fetch = fetcher.fetch;//only use fetchWithCookies or defaultFetchURL for Tests

function setSharedVariable(key, value) {
}

function getSharedVariable(key) {
}

async function fetchPage({ canonicalURL, requestURL, requestOptions, headers }) {
    if (!requestOptions) requestOptions = { method: "GET", headers };
    if (!canonicalURL) canonicalURL = requestURL;
    if (!requestURL) requestURL = canonicalURL;
    if (requestURL.match(/^https/i)) {
        requestOptions.agent = new https.Agent({ rejectUnauthorized: false });
        console.log("using a custom agent");
    }
    return await fetch(requestURL, requestOptions)
        .then(response => {
            return {
                canonicalURL,
                request: Object.assign({ URL: requestURL }, requestOptions),
                response
            };
        });
}

async function fetchURL({ canonicalURL, headers }) {
    if (/https?:.*https?:/i.test(canonicalURL)) {
        console.error("Rejecting URL", canonicalURL, `returning [];`);
        return [];
    }
    let requestURL = null;
    if (/nav_re\.do/i.test(canonicalURL) && !/iframe/i.test(canonicalURL)) {
        let connector = /\?/i.test(canonicalURL) ? "&" : "?";
        requestURL = canonicalURL + connector + "iframe=true";
    }
    return [await fetchPage({ canonicalURL, requestURL, headers })];
}
