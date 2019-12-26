const readline = require("readline");
const fs = require("fs");

const createReadlineInterface = (path) => {
    return readline.createInterface({
        input: fs.createReadStream(path),
        output: process.stdout,
        console: false
    });
}

module.exports = {
    createReadlineInterface
}