"use strict";


import moment from "moment";
import { load } from "cheerio";

async function parsePage({ URL, responseBody, html }) {
    if (!/pdf/i.test(responseBody.fileFormat)) {
        console.error("Error: File is NOT valid PDF " + URL);
        return [];
    }
    const out = {
        URI: [URL, decodeURI(URL), encodeURI(decodeURI(URL))].filter((c, i, a) => a.indexOf(c) === i)
    };
    const dataType = "MEDIA";
    const locale = "es";
    out.originalPdf = [{
        mediaObjectId: responseBody.id,
        // fileFormat: responseBody.fileFormat,
        locale, dataType
    }];

    if (!html) {
        try {
            html = await runRemoteFilter({ URL, filter: "pdf2htmlEx" });
        } catch (e) {
            console.error("PDF transcoding failed", e);
        }
    }
    if (html) {
        // const $ = cheerio.load(html);
        // const $ = load(html)
        // if ($.text().trim().length > 20)
        out.htmlContent = { fileFormat: "text/html", content: html, locale, dataType };
    } else {
        out.htmlContent = null;
        out.text = null;
    }
    let text = await runRemoteFilter({ URL, filter: "pdftotext_raw" });
    out.text = text && text.trim() && { content: text, locale, fileFormat: "text/plain", dataType } || null;

    return [out];
}

const runRemoteFilter = async function ({ URL, id, filter }) {
    let textContent = "";
    const URLId = URL && "H" + new Buffer(URL).toString("base64");
    const URLIdN = URL && "H" + sha256(URL) + ".N";
    let query = `
              query {` +
        `
                nodes(ids: ["${URL && `${URLId}", "${URLIdN}` || `${id}`}"]) {`
        + `               id
                ... on CrawledURL {
                  lastSuccessfulRequest {
                    outputForFilter(filter: "${filter}")
                  }
                }
              }
            }`;
    const resp = await graphql(query);

    let node = resp.nodes.filter(n => n)[0];

    if (node
        && node.lastSuccessfulRequest
        && node.lastSuccessfulRequest.outputForFilter
        && node.lastSuccessfulRequest.outputForFilter.length
        && node.lastSuccessfulRequest.outputForFilter[0]
        && node.lastSuccessfulRequest.outputForFilter[0].filterOutput
        && node.lastSuccessfulRequest.outputForFilter[0].filterOutput.content) {
        let _text = node.lastSuccessfulRequest.outputForFilter[0].filterOutput.content;
        textContent += _text;
    } else {
    }
    return textContent;
};
