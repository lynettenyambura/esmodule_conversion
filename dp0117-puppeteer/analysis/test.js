"use strict";


// const fs = require("fs");
// const cheerio = require("cheerio");

import fs from 'fs'
import { load } from 'cheerio';

let html = fs.readFileSync("../files/res.html")
let $ = load(html);

const nr = $("[color]:contains('NR:')").next().text();
console.log(`nr: ${nr}`);