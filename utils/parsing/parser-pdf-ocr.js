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

    if (html) {
        out.htmlContent = { fileFormat: "text/html", content: html, locale, dataType };
    } else {
        out.htmlContent = null;
        out.text = null;
    }
    let text = await runRemoteFilter({ URL, filter: "pdftotext_raw" });
    if (!text || !text.trim())
        text = await runRemoteOCRFilter({ URL, filter: "abbyOcr" });
    //throw(JSON.stringify(text, null, 2));
    if (text && text.mediaObjectId) {
        text.locale = locale;
        out.text = text;
    } else if (typeof text === "string")
        out.text = text && text.trim() && { content: text, locale, fileFormat: "text/plain", dataType } || null;

    return [out];
}

const getResp = async function ({ URL, id, filter }) {
    let textContent = null;
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
    return resp;
}

const runRemoteFilter = async function ({ URL, id, filter = 'pdftotext_raw' }) {
    let textContent = null;
    const resp = await getResp({ URL, id, filter })
    let node = resp.nodes.filter(n => n)[0];
    if (node
        && node.lastSuccessfulRequest
        && node.lastSuccessfulRequest.outputForFilter
        && node.lastSuccessfulRequest.outputForFilter.length
        && node.lastSuccessfulRequest.outputForFilter[0]
        && node.lastSuccessfulRequest.outputForFilter[0].filterOutput
        && node.lastSuccessfulRequest.outputForFilter[0].filterOutput.content) {
        let _text = node.lastSuccessfulRequest.outputForFilter[0].filterOutput.content;
        textContent = _text;
    }
    return textContent;
};

const runRemoteOCRFilter = async function ({ URL, id, filter = 'abbyOcr' }) {
    const resp = await getResp({ URL, id, filter })
    let textContent = null;

    let node = resp.nodes.filter(n => n)[0];
    if (node
        && node.lastSuccessfulRequest
        && node.lastSuccessfulRequest.outputForFilter
        && node.lastSuccessfulRequest.outputForFilter.length
        && node.lastSuccessfulRequest.outputForFilter[0]
        && node.lastSuccessfulRequest.outputForFilter[0].filterOutput
        && node.lastSuccessfulRequest.outputForFilter[0].filterOutput.transcodedMediaObject) {
        let transcodedMediaObject = node.lastSuccessfulRequest.outputForFilter[0].filterOutput.transcodedMediaObject;
        if (/pdf/i.test(transcodedMediaObject.fileFormat)) {
            return transcodeMediaObject({ mediaObjectId: transcodedMediaObject.id, filter: "pdftotext" })
        } else if (/text/i.test(transcodedMediaObject.fileFormat)) {
            textContent = await transcodedMediaObject.getContent();
        }
        textContent = {
            mediaObjectId: transcodedMediaObject.id,
            fileFormat: transcodedMediaObject.fileFormat,
        };
    }
    return textContent;
};

async function transcodeMediaObject({ mediaObjectId, filter }) {
    const resp = await graphql(`
    mutation {
      transcodeMediaObject (input: {
        clientMutationId: "0",
        filter: "${filter}",
        mediaObjectId: "${mediaObjectId}"

      }) {
        mediaObject {
          id, content
        }
      }
    }
`)

    return resp && resp.transcodeMediaObject && resp.transcodeMediaObject.mediaObject && resp.transcodeMediaObject.mediaObject.content;
}
