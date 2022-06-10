const readline = require("readline");
const fs = require("fs");

const createReadlineInterface = (path) => {
    return readline.createInterface({
        input: fs.createReadStream(path),
        output: process.stdout,
        terminal: false
    });
}

const typeFromPathWithDefaultExtension = (path, defaultExtension) => {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                if(defaultExtension) {
                    fs.stat(`${path}.${defaultExtension}`, (err) => {
                        if(err) reject(err);
                        resolve("file");
                    })
                } else {
                    reject(err);
                }
            } else {
                resolve(stats.isDirectory() ? "folder" : "file")
            }
        })
    })
}

module.exports = {
    createReadlineInterface, typeFromPathWithDefaultExtension
}