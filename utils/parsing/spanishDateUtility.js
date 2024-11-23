"use strict";

import moment from "moment";

/*Utility to convert a spanish date, month, year in text, to numbers*/

const utility = {
    initialized: false,
    init: function () {
        if (this.initialized) return;
        // console.log("initializing");
        //populate other numbers <100
        for (let i = 30; i < 100; i++) {
            if (this.numbers[i]) continue;
            let tens = Math.floor(i / 10) * 10;
            let ones = i % 10;
            this.numbers[i] = this.numbers[tens] + " y " + this.numbers[ones];
        }
        this.initialized = true;
    },
    matchNo: function (text) {
        this.init();
        for (let x in this.numbers) {
            if (this.numbers[x] === text.toLowerCase().replace(/\s+/g, " ").trim())
                return parseInt(x);
        }
        // console.error("No match: " + text);
        return null;
    },
    splitBigNo: function (text) {
        this.init();
        let currentValue = 0;
        let value = this.matchNo(text);
        if (value) {
            return currentValue + value;
        }
        let match = /(.*mil\s*)/i.exec(text);
        if (match) {//hundreds
            let thousands = match[1];
            text = text.replace(thousands, "").trim();
            let howMany = thousands.replace(/\s*mil\s*$/i, "").trim();
            howMany = howMany ? this.splitBigNo(howMany) : 1;
            currentValue += 1000 * howMany;
        }
        value = this.matchNo(text);
        if (value) {
            return currentValue + value;
        }
        match = /([^\s]*cien(tos)?\s*)/i.exec(text);
        if (match) {//hundreds
            let hundreds = match[1];
            text = text.replace(hundreds, "").trim();
            if (hundreds === 'ciento') hundreds = "cien";
            let howMuch = this.matchNo(hundreds);
            currentValue += howMuch;
        }
        value = this.matchNo(text);
        if (value) {
            return currentValue + value;
        }
        return currentValue;
    },
    numbers: {
        "1": "uno",
        "2": "dos",
        "3": "tres",
        "4": "cuatro",
        "5": "cinco",
        "6": "seis",
        "7": "siete",
        "8": "ocho",
        "9": "nueve",
        "10": "diez",
        "11": "once",
        "12": "doce",
        "13": "trece",
        "14": "catorce",
        "15": "quince",
        "16": "dieciséis",
        "17": "diecisiete",
        "18": "dieciocho",
        "19": "diecinueve",
        "20": "veinte",
        "21": "veintiuno",
        "22": "veintidós",
        "23": "veintitrés",
        "24": "veinticuatro",
        "25": "veinticinco",
        "26": "veintiséis",
        "27": "veintisiete",
        "28": "veintiocho",
        "29": "veintinueve",
        "30": "treinta",
        "40": "cuarenta",
        "50": "cincuenta",
        "60": "sesenta",
        "70": "setenta",
        "80": "ochenta",
        "90": "noventa",
        "100": "cien",
        "200": "doscientos",
        "300": "trescientos",
        "400": "cuatrocientos",
        "500": "quinientos",
        "600": "seiscientos",
        "700": "setecientos",
        "800": "ochocientos",
        "900": "novecientos",
        "1000": "mil"
    },
    parseSpanishDate: function (spanishDate) {

        let match = /(.+)\s+del?\s+([^\s]+)\s+del?\s+(.+)/i.exec(spanishDate);
        let day = match[1];
        let month = match[2];//ok
        let year = match[3];

        day = /^\d+$/i.test(day) ? day : this.matchNo(day);
        year = /^\d+$/i.test(year) ? year : this.splitBigNo(year);
        let date = null;
        if (day && year) {
            let d = moment(`${day}-${month.toLowerCase()}-${year}`, ['D-MMMM-YYYY'], 'es');
            date = d.isValid() ? d.format("YYYY-MM-DD") : null;
        }
        return date;
    }
};

console.log(utility.parseSpanishDate("veinticuatro de noviembre de  dos mil dieciocho"));
console.log(utility.parseSpanishDate("ocho de julio de 2020"));

exports.utility = utility;
