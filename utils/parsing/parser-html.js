"use strict";


import moment from "moment";
import { load } from "cheerio";

const sanitizeHtml = (x) => x;


function parsePage({ URL, responseBody, html, responseURL }) {
    const doc = {
        URI: [URL, decodeURI(URL), encodeURI(decodeURI(URL))].filter((c, i, a) => a.indexOf(c) === i)
    };
    const dataType = "MEDIA";
    const locale = "es";
    html = responseBody.content;
    if (html) {
        let $ = load(html, { decodeEntities: false });
        $("script, meta, base, iframe, frame").remove();
        $("a[href]").each(function (i) {
            let a = $(this);
            a.replaceWith(a.html());
        });
        doc.htmlContent = { fileFormat: "text/html", content: sanitizeHtml($.html()), locale, dataType };
    }
    return [doc];
}
