"use strict";

import fs from 'fs'
import { load } from 'cheerio';
import path from 'path';
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let links = `https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2022-08-01&to=2022-09-28
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2022-01-01&to=2022-08-01
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2022-01-01&to=2022-09-28
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2018-01-01&to=2020-12-31
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2018-01-01&to=2020-12-31&page=2
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2020-01-01&to=2020-12-31
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2018-01-01&to=2019-12-31
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2018-01-01&to=2019-12-31&page=2
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2019-01-01&to=2019-12-31
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2018-01-01&to=2018-12-31
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2017-01-01&to=2018-12-31&page=2
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2017-01-01&to=2018-12-31&page=2
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2010-01-01&to=2012-12-31&page=2
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2012-01-01&to=2012-12-31
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2013-01-01&to=2013-12-31
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2014-01-01&to=2014-12-31
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2015-01-01&to=2015-12-31
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2011-01-01&to=2011-12-31
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2021-01-01&to=2021-12-31
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2022-01-01&to=2022-10-14
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2016-01-01&to=2020-12-31
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2013-01-01&to=2016-12-31
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2010-01-01&to=2012-12-31
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2008-01-01&to=2010-12-31
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=1960-01-01&to=2007-12-31
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2016-01-01&to=2020-12-31&page=3
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2016-01-01&to=2020-12-31&page=2
https://normasapf.funcionpublica.gob.mx/NORMASAPF/restricted/General.jsf?from=2013-01-01&to=2016-12-31&page=2
`.split(/\s*\n\s*/ig).filter(x => x);

const $ = load("<h1>Custom Links</h1><hr/><div id='custom-links'></div>", { decodeEntities: false });
let div = $('div#custom-links');
for (let i = 0; i < links.length; i++) {
    let link = links[i];
    div.append(` <a href="${link}">${(i + 1)}</a> ${(i && i % 15 === 0 ? "<br/>" : "")}`)
}

fs.writeFileSync(path.join(__dirname, 'pdf', 'links.html'), $.html())

