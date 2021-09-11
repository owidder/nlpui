const path = require("path");
const fs = require("fs");

const TFIDF_EXTENSION = "tfidf.csv";

const {createReadlineInterface} = require("./fileUtil");

function sortNonCaseSensitive(list) {
    return list.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
}

function pathTypeFromStats(stats) {
    return stats.isDirectory() ? "folder" : "file";
}

function getPathTypeSync(relPath, basePath) {
    const absPath = path.join(basePath, relPath);
    if(fs.existsSync(absPath)) {
        return fs.statSync(absPath).isDirectory() ? "folder" : "file";
    } else {
        if(fs.existsSync(`${absPath}.${TFIDF_EXTENSION}`)) {
            return "file";
        }
    }

    throw "unknown path"
}

function getPathType(relPath, basePath) {
    const absPath = path.join(basePath, relPath);
    return new Promise((resolve, reject) => {
        fs.stat(absPath, (err, stats) => {
            if (err) {
                fs.stat(`${absPath}.${TFIDF_EXTENSION}`, (err) => {
                    if(err) reject(err);
                    resolve("file");
                })
            } else {
                resolve(pathTypeFromStats(stats))
            }
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
                    wordsAndValues.push({word: wordAndValue[0], value: Number(wordAndValue[1])});
                }
            }).on("close", () => {
                resolve(wordsAndValues)
            })
        } else {
            resolve([])
        }
    })
}

function _readSubAggFoldersRecursive(relFolder, basePath) {
    const subAggs = {};
    const absFolder = path.join(basePath, relFolder);
    return new Promise(async resolve => {
        fs.readdir(absFolder, async (err, filesAndSubfolders) => {
            for(const f of filesAndSubfolders) {
                const subFolder = path.join(relFolder, f);
                const type = await getPathType(subFolder, basePath);
                if(type === "folder") {
                    const aggFolder = await readAggFolder(subFolder, basePath);
                    const words = aggFolder.map(wav => wav.word);
                    const children = await _readSubAggFoldersRecursive(subFolder, basePath);
                    subAggs[f] = {words, children};
                }
            }
            resolve(subAggs)
        });
    })
}

function readSubAggFolders(relFolder, basePath) {
    return new Promise(async resolve => {
        const subAggs = await _readSubAggFoldersRecursive(relFolder, basePath);
        resolve(subAggs)
    })
}

module.exports = {readSrcFolder, getPathType, readAggFolder, readSrcFolder2, TFIDF_EXTENSION, getPathTypeSync, readSubAggFolders}
