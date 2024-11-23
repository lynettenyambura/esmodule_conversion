"use strict";

import moment from "moment";
import { load } from "cheerio";
import url from 'url';
import querystring from 'querystring';
import fs from 'fs'
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sanitizeHtml = (x) => x;

function parsePage({ responseBody, URL, html, referer }) {
  console.log(`parsePage: parsing: ${responseBody.fileFormat} ${URL}`);
  let lines = responseBody.content.toString().split(/\s*\n\s*/g).filter(l => /https?:.+\.pdf/i.test(l));
  let urls = `{
  "data": {
    "viewer": {
      "records": {
        "edges": [
          {
            "node": {
              "uris": [
                "https://drive.google.com/file/d/0B22STZ-0xCf9Z2JoNTFiaHBHczA/view?usp=sharing"
              ]
            }
          },
          {
            "node": {
              "uris": [
                "https://corpoguajira.gov.co/wp/resoluciones-mayo-junio-2018"
              ]
            }
          },
          {
            "node": {
              "uris": [
                "https://drive.google.com/file/d/0B22STZ-0xCf9d1FPalBpTWlhN0U/view?usp=sharing"
              ]
            }
          },
          {
            "node": {
              "uris": [
                "https://drive.google.com/open?id=0B8vzRVPTrXR2a3pIYWZUMWI3V2s"
              ]
            }
          },
          {
            "node": {
              "uris": [
                "https://drive.google.com/file/d/0B22STZ-0xCf9aXRoY0dUQ1RKdGc/view?usp=sharing"
              ]
            }
          },
          {
            "node": {
              "uris": [
                "https://drive.google.com/file/d/0B22STZ-0xCf9S2pYYjktN3NGaTg/view?usp=sharing"
              ]
            }
          },
          {
            "node": {
              "uris": [
                "https://drive.google.com/file/d/0B22STZ-0xCf9RkwyRnh0MGhOWUE/view?usp=sharing"
              ]
            }
          },
          {
            "node": {
              "uris": [
                "https://drive.google.com/file/d/0B22STZ-0xCf9bkFkT3RWTHZLZzA/view?usp=sharing"
              ]
            }
          },
          {
            "node": {
              "uris": [
                "https://drive.google.com/file/d/0B22STZ-0xCf9VnREc2tteTZFb1k/view?usp=sharing"
              ]
            }
          },
          {
            "node": {
              "uris": [
                "https://drive.google.com/file/d/0B22STZ-0xCf9c0xRRjEwWVNEY0k/view?usp=sharing"
              ]
            }
          },
          {
            "node": {
              "uris": [
                "https://drive.google.com/file/d/0B22STZ-0xCf9ZEhNTURLYWtSTDQ/view?usp=sharing"
              ]
            }
          },
          {
            "node": {
              "uris": [
                "https://drive.google.com/file/d/0B22STZ-0xCf9Sy1wTXkyNk9tNWM/view?usp=sharing"
              ]
            }
          },
          {
            "node": {
              "uris": [
                "https://drive.google.com/file/d/0B22STZ-0xCf9RU04WXNCa2IyT1U/view?usp=sharing"
              ]
            }
          },
          {
            "node": {
              "uris": [
                "https://drive.google.com/file/d/0B22STZ-0xCf9NlY5eHNoR2JuMnc/view?usp=sharing"
              ]
            }
          },
          {
            "node": {
              "uris": [
                "https://corpoguajira.gov.co/wp/wp-content/uploads/2020/10/RESOLUCION-POLITICA-DE-TRATAMIENTO-DE-DATOS-NUEVO-7-DE-OCT-DE-2020.pdf"
              ]
            }
          },
          {
            "node": {
              "uris": [
                "https://drive.google.com/file/d/0B22STZ-0xCf9bFAwY0N2a25NTEk/view?usp=sharing"
              ]
            }
          },
          {
            "node": {
              "uris": [
                "https://drive.google.com/file/d/0B22STZ-0xCf9dVVpU1pOZmtFUms/view?usp=sharing"
              ]
            }
          },
          {
            "node": {
              "uris": [
                "https://docs.google.com/a/corpoguajira.gov.co/uc?id=0B9ZBqsLl6oM7OHJkbjJjRTk1d0E&export=download"
              ]
            }
          }
        ]
      }
    }
  }
}`
    .split(/\s*\n\s*/ig).map(x => x && x.trim().replace(/^[\W]+|[\W]+$/gi, ''));
  return urls.filter(x => x && /https/i.test(x));
  // let filtered = urls.filter(u => true);
  // return urls;
}

const parserTest = function () {
  const filePath = path.join(__dirname, 'pdf', 'links-text.txt');

  let buffer = fs.readFileSync(filePath)
  buffer = parsePage({
    responseBody: { content: buffer.toString(), buffer, fileFormat: "text/html" },
    URL: "",
    referer: "",
    html: null
  });
  // console.log(JSON.stringify(buffer, null, 4));
  for (let i = 0; i < buffer.length; i++) {
    let l = buffer[i];
    console.log(l);
  }
  console.log(buffer.length);
};
parserTest();
