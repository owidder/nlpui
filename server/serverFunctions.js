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
            if(!fileOrSubfolder.startsWith("__") && !fileOrSubfolder.startsWith(".") && !(fileOrSubfolder === "_.csv")) {
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

function readSrcFolder2(relFolder, basePath) {
    const absFolder = path.join(basePath, relFolder);
    return new Promise((resolve, reject) => {
        fs.readdir(absFolder, async (err, filesAndSubfolders) => {
            const filtered = await filterFolders(filesAndSubfolders, relFolder, basePath);
            const withoutTfIdfExtension = filtered.map(f => f.split(".tfidf.csv")[0]);
            if (err) reject(err);
            resolve(sortNonCaseSensitive(withoutTfIdfExtension));
        });
    })
}

function readAggFolder(relFolder, basePath) {
    const absFolder = path.join(basePath, relFolder);
    return new Promise(resolve => {
        const absPathToFile = path.join(absFolder, "_.csv");
        if(fs.existsSync(absPathToFile)) {
            const readLineInterface = createReadlineInterface(path.join(absFolder, "_.csv"));
            const wordsAndValues = [];
            let lineNo = 0;
            readLineInterface.on("line", line => {
                if(lineNo++ < 20) {
                    const wordAndValue = line.split("\t");
                    wordsAndValues.push({word: wordAndValue[0], value: wordAndValue[1]});
                }
            }).on("close", () => {
                resolve(wordsAndValues)
            })
        } else {
            resolve([])
        }
    })
}

module.exports = {readSrcFolder, getPathType, readAggFolder, readSrcFolder2}
