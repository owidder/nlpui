const path = require("path");
const fs = require("fs");

const TFIDF_EXTENSION = "tfidf.csv";

const {createReadlineInterface} = require("./fileUtil");

let stopwords = {};
let unstemDict;
let reversedUnstemDict;
let numberOfFiles = 0;

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

const waitForCallback = (callback) => {
    return new Promise(resolve => {
        setTimeout(() => {
            callback();
            resolve();
        }, 10)
    })
}

function _readSubAggFoldersRecursive(relFolder, basePath, progressCallback, totalCtr) {
    let _children = undefined;
    const absFolder = path.join(basePath, relFolder);
    return new Promise(async (resolve, reject) => {
        try {
            fs.readdir(absFolder, async (err, filesAndSubfolders) => {
                let ctr = 0;
                for (const f of filesAndSubfolders) {
                    const subFolder = path.join(relFolder, f);
                    const type = await getPathType(subFolder, basePath);
                    if (type === "folder") {
                        const aggValues = await readAggFolder(subFolder, basePath);
                        const filteredUnstemmed = filterStopwordsAndUnstem(subFolder, aggValues);
                        const words = filteredUnstemmed.map(wav => wav.word);
                        const [children, subCtr] = await _readSubAggFoldersRecursive(subFolder, basePath, progressCallback, totalCtr);
                        _children = _children ? _children : []
                        _children.push({name: f, value: subCtr, words, children});
                    } else {
                        if(f != "_.csv") {
                            if(++totalCtr.ctr % (100 + (Math.floor(Math.random() * 10))) == 0) {
                                await waitForCallback(() => progressCallback(totalCtr.ctr));
                            }
                            ctr++;
                        }
                    }
                }
                resolve([_children, ctr])
            });
        } catch (e) {
            reject(e)
        }
    })
}

function _countFilesRecursive(relFolder, basePath) {
    return new Promise(async (resolve, reject) => {
        try {
            const absFolder = path.join(basePath, relFolder);
            fs.readdir(absFolder, async (err, filesAndSubfolders) => {
                let ctr = 0;
                for (const f of filesAndSubfolders) {
                    const subFolder = path.join(relFolder, f);
                    const type = await getPathType(subFolder, basePath);
                    if (type === "folder") {
                        ctr += await _countFilesRecursive(subFolder, basePath)
                    } else {
                        if(f != "_.csv") {
                            ctr++;
                        }
                    }
                }
                resolve(ctr)
            });
        } catch (e) {
            reject(e)
        }
    })
}

function initNumberOfFiles(relFolder, basePath) {
    return new Promise(async resolve => {
        numberOfFiles = await _countFilesRecursive(relFolder, basePath);
        resolve(numberOfFiles);
    })
}

function getNumberOfFiles() {
    return numberOfFiles;
}

function readSubAggFolders(relFolder, basePath, progressCallback) {
    return new Promise(async (resolve, reject) => {
        try {
            const [children] = await _readSubAggFoldersRecursive(`tfidf/${relFolder}`, basePath, progressCallback, {ctr: 0});
            resolve({name: (relFolder.length > 0 ? relFolder : "."), children})
        } catch (e) {
            reject(e)
        }
    })
}

const saveStopwords = (stopwordspath) => {
    const stopwordsStr = JSON.stringify(stopwords, null, 4);
    fs.writeFileSync(stopwordspath, stopwordsStr);
}

const filterStopwords = (path, wordsAndValues) => {
    let filteredWordsAndValues = [...wordsAndValues]
    for(const _path in stopwords) {
        filteredWordsAndValues = filteredWordsAndValues.filter(wav => {
            if(_path == "." || path.startsWith(_path)) {
                return !stopwords[_path].includes(wav.word)
            }

            return true
        })
    }

    return filteredWordsAndValues
}

const filterStopwordsAndUnstem = (path, wordsAndValues) => {
    const filteredWordsAndValues = filterStopwords(path, wordsAndValues);
    return  filteredWordsAndValues.map(wav => {
        return {...wav, word: unstem(wav.word)}
    })
}

const initStopwords = (stopwordspath) => {
    if(fs.existsSync(stopwordspath)) {
        const stopwordsStr = fs.readFileSync(stopwordspath);
        stopwords = JSON.parse(stopwordsStr);
    }
}

const readUnstemDict = (datapath) => {
    const unstemDictPath = path.join(datapath, "unstem_dict.json");
    if(fs.existsSync(unstemDictPath)) {
        const unstemDictJson = fs.readFileSync(unstemDictPath);
        return JSON.parse(unstemDictJson);
    }

    return {}
}

const createReversedDict = (dict) => {
    return Object.keys(dict).reduce((_rev, word) => {
        return {..._rev, [dict[word]]: word}
    }, {})
}

const unstem = (word) => unstemDict[word] ? unstemDict[word] : word;

const initUnstemDict = (datapath) => {
    unstemDict = readUnstemDict(datapath);
    reversedUnstemDict = createReversedDict(unstemDict);
}

module.exports = {
    readSrcFolder, getPathType, readAggFolder, readSrcFolder2, TFIDF_EXTENSION, getPathTypeSync, readSubAggFolders,
    initStopwords, saveStopwords, filterStopwordsAndUnstem, stopwords, initUnstemDict, unstem, initNumberOfFiles, getNumberOfFiles
}
