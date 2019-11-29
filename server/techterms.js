const fs = require("fs");
const readline = require("readline");

const maybeTechTerms = [];

const createReadlineInterface = (path) => {
    return readline.createInterface({
        input: fs.createReadStream(path),
        output: process.stdout,
        console: false
    });
}
const initMaybeTechTerms = (techpath) => {
    return new Promise(resolve => {
        const linereader = createReadlineInterface(techpath);
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
