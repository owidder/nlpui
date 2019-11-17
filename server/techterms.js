const fs = require("fs");
const readline = require("readline");

const STACKEXCHANGE_PATH = "/Users/oliver/dev/github/nlp/dict/stackexchange.txt";

const maybeTechTerms = [];

const createReadlineInterface = (path) => {
    return readline.createInterface({
        input: fs.createReadStream(path),
        output: process.stdout,
        console: false
    });
}
const initMaybeTechTerms = () => {
    return new Promise(resolve => {
        const linereader = createReadlineInterface(STACKEXCHANGE_PATH);
        linereader.on("line", line => {
            maybeTechTerms.push(line);
        }).on("close", resolve);
    })
}

const isMaybeTechTerm = (term) => {
    return (maybeTechTerms.indexOf(term) > -1)
}

module.exports = {
    initMaybeTechTerms,
    isMaybeTechTerm,
}
