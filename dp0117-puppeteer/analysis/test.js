"use strict";


const fs = require("fs");
const cheerio = require("cheerio");

let html = fs.readFileSync("../files/res.html")
let $ = cheerio.load(html);

const nr = $("[color]:contains('NR:')").next().text();
console.log(`nr: ${nr}`);