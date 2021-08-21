const path = require("path");
const fs = require("fs");

const {createReadlineInterface} = require("./fileUtil");

function sortNonCaseSensitive(list) {
    return list.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
}

function pathTypeFromStats(stats) {
    return stats.isDirectory() ? "folder" : "file";
}

function getPathType(relPath, basePath) {
    const absPath = path.join(basePath, relPath);
    return new Promise((resolve, reject) => {
        fs.stat(absPath, (err, stats) => {
            if (err) reject(err);
            resolve(pathTypeFromStats(stats))
        })
    })
}

const  filterFolders = async (filesAndSubfolders, relPath, basePath) => {
    const filtered = []
    for(const fileOrSubfolder of filesAndSubfolders) {
        const pathType = await getPathType(`${relPath}/${fileOrSubfolder}`, basePath)
        if(pathType === "file") {
            if(!fileOrSubfolder.startsWith("__") && !fileOrSubfolder.startsWith(".")) {
                filtered.push(fileOrSubfolder)
            }
        } else {
            filtered.push(fileOrSubfolder)
        }
    }

    return filtered
}

function readSrcFolder(relFolder, basePath) {
    const absFolder = path.join(basePath, relFolder);
    return new Promise((resolve, reject) => {
        fs.readdir(absFolder, async (err, filesAndSubfolders) => {
            const filtered = await filterFolders(filesAndSubfolders, relFolder, basePath);
            if (err) reject(err);
            resolve(sortNonCaseSensitive(filtered));
        });
    })
}

function readAggFolder(relFolder, basePath) {
    const absFolder = path.join(basePath, relFolder);
    return new Promise(resolve => {
        const readLineInterface = createReadlineInterface(path.join(absFolder, "_.csv"));
        const wordsAndValues = [];
        readLineInterface.on("line", line => {
            const wordAndValue = line.split("\t");
            wordsAndValues.push({word: wordAndValue[0], value: wordAndValue[1]});
        }).on("close", () => {
            resolve(wordsAndValues)
        })
    })
}

module.exports = {readSrcFolder, getPathType, readAggFolder}
