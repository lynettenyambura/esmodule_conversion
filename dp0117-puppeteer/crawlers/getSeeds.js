//const moment = require("moment");
import moment from "moment";

const BASE_URL = 'https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/ce/index.xhtml';

function getSeeds() {
    let start = moment('2020-01-01');
    let stop = moment().subtract(1, 'months');

    start = moment('2020-01-05');
    stop = moment('2020-10-16');

    let links = [];
    for (let date = start; date.isSameOrBefore(stop); date = date.add(1, 'months')) {

        const currentDateString = date.format('YYYY-MM-DD');
        const currentDay = moment(currentDateString);

        const month = currentDay.month() + 1;
        const lastDateString = `${currentDay.year()}-${getMonthAsString(month)}-${getLastDayOfMonth(currentDay.year(), month)}`;

        let url = `${BASE_URL}?start=${currentDateString}&stop=${lastDateString}`;

        if (date.month() == start.month() && date.year() == start.year()) {
            url = `${BASE_URL}?start=${start.format('YYYY-MM-DD')}&stop=${lastDateString}`;
        }

        if (date.year() == stop.year() && date.month() == stop.month()) {
            url = `${BASE_URL}?start=${currentDateString}&stop=${stop.format('YYYY-MM-DD')}`;
        }

        links.push(url);
        console.log(`Generating seed URL ${url}`);
    }

    return links.reverse();
}

const getLastDayOfMonth = function (y, m) {
    if (m < 1 || m > 12) {
        throw new Error(`Invalid value for month ${m}`);
    }
    return new Date(y, m, 0).getDate();
}

const getMonthAsString = function (month) {
    let padded_month = month + ""; // Convert to String
    return padded_month.lpad("0", 2);
}

String.prototype.lpad = function (padString, length) {
    var str = this;
    while (str.length < length)
        str = padString + str;
    return str;
}

getSeeds();

