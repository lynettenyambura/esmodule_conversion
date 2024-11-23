"use strict";


import querystring from 'querystring';
import FormData from 'form-data';
import moment from 'moment';
import url from 'url';
import { load } from 'cheerio';
import fetch from 'node-fetch';
import https from 'https';

import { fetchWithCookies, defaultFetchURL } from '../../utils/fetcher';

// let fetch = fetcher.fetch;//only use fetchWithCookies or defaultFetchURL for Tests


let map = {};

function setSharedVariable(key, value) {
    map[key] = value;
}

function getSharedVariable(key) {
    return map[key];
}

async function fetchPage({ canonicalURL, requestURL, requestOptions, headers }) {
    if (!requestOptions) requestOptions = { method: "GET", headers };
    if (!canonicalURL) canonicalURL = requestURL;
    if (!requestURL) requestURL = canonicalURL;
    if (requestURL.match(/^https/i)) {
        requestOptions.agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });
    }
    return await fetchWithCookies(requestURL, requestOptions)
        .then(response => {
            return {
                canonicalURL,
                request: Object.assign({ URL: requestURL }, requestOptions),
                response
            };
        });
}

const getVimeoEmbedCode = async function ({
    vimeoId,
    canonicalURL,
    headers = { 'user-agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Safari/605.1.15" }
}) {
    let customHeaders = {
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
        "sec-ch-ua": "\" Not;A Brand\";v=\"99\", \"Google Chrome\";v=\"97\", \"Chromium\";v=\"97\"",
        "DNT": "1",
        "X-Requested-With": "XMLHttpRequest",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        "Referer": "https://vimeo.com/" + vimeoId,
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);

    let method = "GET";
    let requestOptions = { method, headers: _headers };
    let requestURL = `https://vimeo.com/embed?width=640&height=360&title=1&byline=1&badge=1&portrait=1&autoplay=0&loop=0&link=1&caption=0&color=00adef&responsive=0&fixed=1&clip_id=${vimeoId}&iframe=true`;

    let responsePage = await fetchPage({ canonicalURL: canonicalURL || requestURL, requestURL, requestOptions });
    let html = await responsePage.response.text();
    responsePage.response = new fetch.Response(html, responsePage.response);

    if (!/^\s^<iframe /i.test(html)) {
        responsePage.response.ok = false;
        responsePage.response.status = 404;
    }

    return responsePage;
};

const tester = async function () {
    let vimeoId = 672844590;
    let resp = await getVimeoEmbedCode({ vimeoId });
    console.log(resp.toString());

};
tester();
