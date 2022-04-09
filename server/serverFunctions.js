const path = require("path");
const fs = require("fs");
const _ = require("lodash");

const {readFeatures} = require("./tfidf");

const TFIDF_EXTENSION = "tfidf.csv";
const IGNORED_EXTENSIONS = ["tfidf_all.csv", "tfidf2.csv"]

const {createReadlineInterface} = require("./fileUtil");

let stopwords = {};
let unstemDict;
let reversedUnstemDict;
let numberOfFiles = 0;

const AGG_CSV = "_.csv";
const IGNORED_AGG_CSV = ["_all.csv", "_2.csv"];

const isNoAggFile = f => !(f === AGG_CSV || IGNORED_AGG_CSV.indexOf(f) > -1);

const SUM_INDEX = 1
const MAX_INDEX = 2
const COUNT_INDEX = 3
const AVG_INDEX = 4

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
    return typeFromPath(absPath);
}

const typeFromPath = (path) => {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                fs.stat(`${path}.${TFIDF_EXTENSION}`, (err) => {
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
            if(!fileOrSubfolder.startsWith("__")
                && !fileOrSubfolder.startsWith(".")
                && isNoAggFile(fileOrSubfolder)
                && IGNORED_EXTENSIONS.filter(ext => fileOrSubfolder.endsWith(ext)).length == 0) {
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

const removeTfIdfExtension = f => f.split(`.${TFIDF_EXTENSION}`)[0];

function readSrcFolder2(relFolder, basePath) {
    const absFolder = path.join(basePath, relFolder);
    return new Promise((resolve, reject) => {
        fs.readdir(absFolder, async (err, filesAndSubfolders) => {
            const filtered = await filterFolders(filesAndSubfolders, relFolder, basePath);
            const withoutTfIdfExtension = filtered.map(removeTfIdfExtension);
            if (err) reject(err);
            resolve(sortNonCaseSensitive(withoutTfIdfExtension));
        });
    })
}

function readAggFolder(relFolder, basePath) {
    const absFolder = path.join(basePath, relFolder);
    return new Promise(resolve => {
        const absPathToFile = path.join(absFolder, AGG_CSV);
        if(fs.existsSync(absPathToFile)) {
            const readLineInterface = createReadlineInterface(absPathToFile);
            const wordsAndValues = [];
            readLineInterface.on("line", line => {
                const wordAndValues = line.split("\t");
                const value = Number(wordAndValues[AVG_INDEX]) * Math.min(Number(wordAndValues[COUNT_INDEX]), 10)
                wordsAndValues.push({word: wordAndValues[0], sum: _.round(wordAndValues[SUM_INDEX], 2),
                    count: Number(wordAndValues[COUNT_INDEX]),
                    max: _.round(wordAndValues[MAX_INDEX], 2),
                    avg: _.round(wordAndValues[AVG_INDEX], 2), value});
            }).on("close", () => {
                resolve(_.sortBy(wordsAndValues, ["value"]).reverse())
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

const readFolderValues = async (subFolder, basePath) => {
    const aggValues = await readAggFolder(subFolder, basePath);
    const unstemmed = unstemWordsAndValues(aggValues);
    const words = unstemmed.map(wav => wav.word);
    const tfidfValues = unstemmed.map(wav => wav.value);
    const sumValues = unstemmed.map(wav => wav.sum);
    const avgValues = unstemmed.map(wav => wav.avg);
    const maxValues = unstemmed.map(wav => wav.max);
    const maxCountValues = unstemmed.map(wav => (wav.max * wav.count));
    const countValues = unstemmed.map(wav => wav.count);

    return {words, tfidfValues, sumValues, avgValues, maxValues, countValues, maxCountValues}
}

const readAllValuesForOneFeature = (relFolder, basePath, feature) => {
    return new Promise(async resolve => {
        const absPath = path.join(basePath, relFolder);
        const absFolder = await typeFromPath(absPath) == "folder" ? absPath : path.dirname(absPath);
        const values = {};
        fs.readdir(absFolder, async (err, filesAndSubfolders) => {
            for (const f of filesAndSubfolders) {
                if(isNoAggFile(f)) {
                    const fileOrFolder = path.join(absFolder, f);
                    const type = await typeFromPath(fileOrFolder);
                    if (type === "folder") {
                        const folderValues = await readFolderValues(fileOrFolder, basePath);
                        const indexOfFeature = folderValues.words.findIndex(w => w === feature);
                        if(indexOfFeature > -1) {
                            values[f] = folderValues.tfidfValues[indexOfFeature];
                        }
                    } else {
                        const fileValues = await readFeatures(fileOrFolder);
                        const unstemmedFileValues = fileValues.map(({feature, value}) => {
                            return {feature: unstem(feature), value}
                        });
                        const indexOfFeature = unstemmedFileValues.findIndex(fv => fv.feature === feature);
                        if(indexOfFeature > -1) {
                            values[removeTfIdfExtension(f)] = unstemmedFileValues[indexOfFeature].value;
                        }
                    }
                }
            }
            resolve(values)
        })
    })
}

function _readSubAggFoldersRecursive(relFolder, basePath, progressCallback, totalCtr) {
    console.log(`_readSubAggFoldersRecursive: ${relFolder}`);
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
                        const folderValues = await readFolderValues(subFolder, basePath);
                        const [children, subCtr] = await _readSubAggFoldersRecursive(subFolder, basePath, progressCallback, totalCtr);
                        _children = _children ? _children : []
                        _children.push({...folderValues, name: f, value: subCtr, children});
                    } else {
                        if(isNoAggFile(f)) {
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
                        if(isNoAggFile(f)) {
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
    return unstemWordsAndValues(filteredWordsAndValues)
}

const unstemWordsAndValues = (wordsAndValues) => {
    return  wordsAndValues.map(wav => {
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
        console.log(word);
        return {..._rev, [dict[word]]: word}
    }, {})
}

const unstem = (word) => unstemDict[word] ? unstemDict[word] : word;

const initUnstemDict = (datapath, reverseUnstem) => {
    unstemDict = readUnstemDict(datapath);
    if(reverseUnstem != null) {
        reversedUnstemDict = createReversedDict(unstemDict);
    }
}

const stemFromUnstem = (unstemmed) => reversedUnstemDict[unstemmed] ? reversedUnstemDict[unstemmed] : unstemmed;

module.exports = {
    readSrcFolder, getPathType, readAggFolder, readSrcFolder2, TFIDF_EXTENSION, getPathTypeSync, readSubAggFolders,
    initStopwords, saveStopwords, filterStopwordsAndUnstem, stopwords, initUnstemDict, unstem, initNumberOfFiles, getNumberOfFiles, stemFromUnstem,
    readAllValuesForOneFeature
}
