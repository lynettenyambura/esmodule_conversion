"use strict";

// const querystring = require("querystring");
// const he = require("he");
// const cheerio = require("cheerio");
// const fs = require("fs");
// const mkdirp = require("mkdirp");
import querystring from "querystring";
import he from "he";
import cheerio from "cheerio";
import fs from 'fs';
import path from 'path';
// import { dirname } from 'path';
// import { fileURLToPath } from 'url';
import mkdirp from "mkdirp";


/**
 * Please do not save changes you make to this file to Git. Unless intentionally updating it's contents.
 *
 * To use this functionality, you have to open chrome developer tools, right click request you want to emulate
 * on the Network tab, and copy as CURL.
 *
 * Paste the copied requests on a text file, each on a single line, in the order which they should be made, from
 * top to bottom. First request at the top
 *
 * Go to the generateCode method at the bottom of this file and rename the variable FILE to point to your file
 *
 * */

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

async function fetchURL({ canonicalURL, headers }) {
    if (/https?:.*https?:/i.test(canonicalURL)) {
        console.error("Rejecting URL", canonicalURL, `returning [];`);
        return [];
    }
    const match = canonicalURL.match(/\?(start|from)=(\d{4}-\d{2}-\d{2}).(end|to)=(\d{4}-\d{2}-\d{2})(&page=(\d+))?$/i);
    if (match) {
        let from = moment(match[2]);
        let to = moment(match[4]);
        let page = match[6] ? parseInt(match[6]) : 1;
        return [await fetchURL({ canonicalURL, headers })]
    } else {
        return defaultFetchURL({ canonicalURL, headers });
    }
}

const parseForm = function (curlString) {
    // throw curlString
    let data = curlString.match(/\s+--data[-raw]*\s+['"](.+)['"](\s|$)/i);
    let method = "POST";
    let isJSON = data && data[1].trim().search(/^[{\[]/i) >= 0;
    if (isJSON) {
        let content = JSON.parse(data[1].trim());
        // throw(JSON.stringify(content, null, 4))
        return { method, string: `let data = ${JSON.stringify(content, null, 4)};\nlet body = JSON.stringify(data);` };
    }
    data = (data && data[1] || "").split("&");
    let form = {};
    for (let i = 0; i < data.length; i++) {
        let d = data[i];
        // console.log(d);
        d = d.match(/^([^&]+)=([^&]*)$/i);
        let name = d ? d[1] : "";
        let value = d ? d[2] : "";
        try {
            let field = decodeURIComponent(name);
            let formValue = decodeURIComponent(value);
            if (form[field] === undefined)
                form[field] = formValue;
            else {
                if (Array.isArray(form[field])) {
                    form[field].push(formValue);
                } else form[field] = [form[field], formValue];
            }
        } catch (e) {
            form[name] = value;
            console.error(`error decoding: '${name}'-'${value}'`);
        }
    }
    let string = `const data = {};`;
    for (let field in form) {
        field && (string += `\ndata["${field}"] = \`${form[field]}\`;`)
    }
    string += `\nlet body = querystring.stringify(data);`;
    return { method, string };
};

function parseFormData(curlString) {
    const text = /--data-\w+ +\$?['"](.+)['"]/i.exec(curlString)[1];
    let boundary = "(-{20,}\\d{5,}[-]*|[-]+WebKitFormBoundary\\S+)";
    // let boundary = "---------------------------4103961533101648661712293079";
    let boundaryRegex = new RegExp(`\\s*${boundary}\\s*`, "ig");
    const results = text.split(boundaryRegex).filter(x => x && x.trim());
    // throw(JSON.stringify(results, null, 4));
    let form = {};
    let formDataString = `const body = new FormData();`;
    let fields = results.map(f => {
        f = f.replace(/(\\n|\\r)/g, " ");
        // .replace(/[-\d]+$/,"");
        let match = /name="([^"]+)"([\s]+(.*))?$/i.exec(f);
        if (!match) {
            console.log('nada: ' + f);
            return;
        }
        let name = match[1];
        let value = (match[3] || "").replace(/\s*-*$/i, '');
        // console.log(name, ":", value);
        return [name, value];
    }).filter(x => x && x[0]);
    fields.forEach(x => {
        form[x[0]] = x[1];
        formDataString += `\nbody.append('${x[0]}', '${x[1]}');`
    });

    return { method: "POST", string: formDataString };
}

const curlContentParser = function ({ curlString, requestIndex, functionPrefix = "method" }) {
    //url
    let requestURL = curlString.match(/curl\s+\$?['"]([^\s]+)['"]/i)[1];
    let method = "GET";
    //GET
    //headers
    let headMatcher = curlString.match(/-H\s+'([^']+):([^']+)'/ig);
    let customHeaders = {};

    for (let i = 0; headMatcher && i < headMatcher.length; i++) {
        let headLine = headMatcher[i];
        headLine = headLine.match(/-H\s+'([^:]+):([^']+)'/i);
        let name = headLine[1];
        if (/accept|user-agent|connection|cookie|Proxy-Authorization/i.test(name)) continue;
        let value = headLine[2].trim();
        if (/content-type/i.test(name) && /boundary/i.test(value)) continue;
        customHeaders[name] = value;
    }
    if (/--compressed/.test(curlString))
        customHeaders['Accept-Encoding'] = 'gzip, deflate, br';

    //data
    let string = "";
    if (/--data\s+/i.test(curlString)) {
        let x = parseForm(curlString);
        [method, string] = [x.method, x.string];
    } else if (/--data-binary\s+|--data-raw\s+\$/i.test(curlString)) {
        let x = parseFormData(curlString);
        [method, string] = [x.method, x.string];
    } else if (/--data-raw\s+/i.test(curlString)) {
        let x = parseForm(curlString);
        [method, string] = [x.method, x.string];
    } else if (/--data/i.test(curlString))
        throw (`UnKnown data-type: ${/--data[\w-]+/i.exec(curlString)}`);
    let fctName = functionPrefix || "function";
    let generatedCode = `\n\n\nconst ${fctName}${requestIndex} = async function ({argument, canonicalURL, headers}) {
        let customHeaders = ${JSON.stringify(customHeaders, null, 4).split(/\n/g).map((l, i) => i ? '\t\t' + l : l).join("\n")};
        let _headers = Object.assign(customHeaders, headers);
        ${string}
        let method = "${method}";
        let requestOptions = {method, ${method.match(/get/i) ? "" : "body, "}headers: _headers};
        let requestURL = '${requestURL}';
        let responsePage = await fetchPage({canonicalURL, requestURL, requestOptions});
        return responsePage;
    };`;
    return generatedCode;
};

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// Get the directory of the current module
const currentDir = path.dirname(new URL(import.meta.url).pathname);

// Construct the path to the "projects.txt" file
const filePath = path.join(currentDir, "/./pdf/dp16632.txt");

const generateCode = function () {

    let FILE = filePath; //set this to target file, with curl requests each on a new line
    let createCrawlerFileOverwriteIfExists = false;
    createCrawlerFileOverwriteIfExists = true;//create and overwrite existing /http/fetch.js file in the project directory

    let contents = fs.readFileSync(FILE);
    if (!contents) {
        console.error("Nothing useful found in target file");
        return;
    }
    contents = contents.toString().replace(/\s*[\\^]\s*\n\s*/ig, " ").split(/\n/g).filter(ln => ln.trim());
    // let generatedCode = `"use strict";\n\nconst querystring = require("querystring");\n`
    //     + `const FormData = require("form-data");\n`
    //     + `const moment = require('moment');\n`
    //     + `const url = require('url');\n`
    //     + `const cheerio = require('cheerio');\n`
    //     + `const fetch = require('node-fetch');//to reconstruct response fetch.Response(html,....)\n\n`
    //     + `const fetcher = require("../../utils/fetcher");\n`
    //     + `let fetchWithCookies = fetcher.fetchWithCookies;\n`
    //     + `// let fetch = fetcher.fetch;//only use fetchWithCookies or defaultFetchURL for Tests\n`
    //     + `let defaultFetchURL = fetcher.defaultFetchURL;\n\n\n`
    //     + `let map = {};\n\n`
    //     + `function setSharedVariable(key, value) { map[key] = value; }\n\n`
    //     + `function getSharedVariable(key) {return map[key];}\n\n\n\n`;
    // generatedCode += fetchPage.toString();
    let generatedCode = `"use strict";\n\nimport querystring from "querystring";\n`
        + `import FormData from "form-data";\n`
        + `import moment from "moment";\n`
        + `import * as url from "url";\n`
        + `import cheerio from "cheerio";\n`
        + `import fetch from "node-fetch"; // to reconstruct response fetch.Response(html,...)\n\n`
        + `import fetcher from "../.g./utils/fetcher";\n`
        + `let fetchWithCookies = fetcher.fetchWithCookies;\n`
        + `// let fetch = fetcher.fetch; // only use fetchWithCookies or defaultFetchURL for Tests\n`
        + `let defaultFetchURL = fetcher.defaultFetchURL;\n\n\n`
        + `let map = {};\n\n`
        + `function setSharedVariable(key, value) { map[key] = value; }\n\n`
        + `function getSharedVariable(key) { return map[key]; }\n\n\n\n`;
    generatedCode += fetchPage.toString();
    let codeIndex = 0;
    contents.forEach((ln, index) => {
        if (!/^\s*curl\s+/i.test(ln))
            generatedCode += `\n\n\n/*\n${ln}\n*/`;
        else
            generatedCode += "\n\n" + curlContentParser({ curlString: ln, requestIndex: codeIndex++ })
    });
    generatedCode += "\n\n" + fetchURL.toString();
    console.log(JSON.stringify(contents, null, 4));
    // generatedCode += "\n\n" + fetchURL.toString();
    console.log(generatedCode);
    if (createCrawlerFileOverwriteIfExists) {
        let name = FILE.match(/[^\/\\]+$/)[0];
        name = name.replace(/\..{2,4}$/, "");
        //let dir = __dirname + "/../" + name + "/http/";
        const dir = path.resolve(path.dirname(import.meta.url), "..", name, "http");
        mkdirp.sync(dir);
        //fs.writeFileSync(dir + 'fetch.js', generatedCode);
        fs.writeFileSync(path.join(dir, 'fetch.js'), generatedCode);
    }
};

generateCode();
