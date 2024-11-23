"use strict";

import moment from "moment";
import { load } from "cheerio";

//use * to HTML (openoffice) filter

function parsePage({ URL, responseBody, html }) {
    if (!/word/i.test(responseBody.fileFormat)) {
        console.error("Error: File is NOT valid DOC " + URL);
        return [];
    }
    const document = {
        URI: [URL, decodeURI(URL), encodeURI(decodeURI(URL))].filter((c, i, a) => a.indexOf(c) === i)
    };
    const dataType = "MEDIA";
    const locale = "es";
    document.originalDoc = [{
        mediaObjectId: responseBody.id,
        // fileFormat: responseBody.fileFormat,
        locale, dataType

    }];

    if (html) {
        let $ = load(html, { decodeEntities: false });
        //doesn't handle pictures well
        $("img").remove();
        document.htmlContent = { fileFormat: "text/html", content: $.html(), locale, dataType };
        document.text = { fileFormat: "text/plain", content: $.text(), locale, dataType };
    } else {
        document.htmlContent = null;
        document.text = html;
    }
    return [document];
}
