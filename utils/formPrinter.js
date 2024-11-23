"use strict";

import { load } from "cheerio";
import fs from 'fs';

const file = "../dp0166/pdf/form.html";

const $ = load(fs.readFileSync(file));

let query = "";
let longs = {};
$("input, textarea, select").each(function () {
    const name = $(this).attr("name");
    if (!name && /(^bt|descargar)/i.exec(name))
        return;
    let value = $(this).val();
    if (value === undefined)
        value = '';
    // if (value.length > 23) {
    //     longs[name] = value;
    //     value = value.substring(0, 10) + "..." + value.substring(value.length - 10)
    // }
    if (query.length > 0)
        query += "&";
    query += name + "=" + (longs[name] ? longs[name] : value);
    console.log(name + " = '" + value + "'");
});
console.log(query);