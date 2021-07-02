const readline = require("readline");
const fs = require("fs");

const createReadlineInterface = (path) => {
    return readline.createInterface({
        input: fs.createReadStream(path),
        output: process.stdout,
        terminal: false
    });
}

module.exports = {
    createReadlineInterface
}