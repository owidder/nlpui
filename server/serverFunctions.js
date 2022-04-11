const path = require("path");
const fs = require("fs");
const _ = require("lodash");

const {readFeatures, TFIDF_EXTENSION, TFIDF_FOLDER} = require("./tfidf");

const IGNORED_EXTENSIONS = ["tfidf_all.csv", "tfidf2.csv"]

const {createReadlineInterface} = require("./fileUtil");
const {unstem, unstemWordsAndValues} = require("./unstem");

let stopwords = {};
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

const filterFolders = async (filesAndSubfolders, absFolder) => {
    const filtered = []
    for(const fileOrSubfolder of filesAndSubfolders) {
        const absFileOrSubfolder = path.join(absFolder, fileOrSubfolder);
        const pathType = await typeFromPath(absFileOrSubfolder);
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

const removeTfIdfExtension = f => f.split(`.${TFIDF_EXTENSION}`)[0];

function readSrcFolder2(absFolder) {
    return new Promise((resolve, reject) => {
        fs.readdir(absFolder, async (err, filesAndSubfolders) => {
            const filtered = await filterFolders(filesAndSubfolders, absFolder);
            const withoutTfIdfExtension = filtered.map(removeTfIdfExtension);
            if (err) reject(err);
            resolve(sortNonCaseSensitive(withoutTfIdfExtension));
        });
    })
}

function readAggFolder(folder) {
    return new Promise(resolve => {
        const absPathToFile = path.join(folder, AGG_CSV);
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

const readFolderValues = async (folder) => {
    const aggValues = await readAggFolder(folder);
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

const readAllValuesForOneFeature = (absPath, feature) => {
    return new Promise(async resolve => {
        const absFolder = await typeFromPath(absPath) == "folder" ? absPath : path.dirname(absPath);
        const values = {};
        fs.readdir(absFolder, async (err, filesAndSubfolders) => {
            for (const f of filesAndSubfolders) {
                if(isNoAggFile(f)) {
                    const fileOrFolder = path.join(absFolder, f);
                    const type = await typeFromPath(fileOrFolder);
                    if (type === "folder") {
                        const folderValues = await readFolderValues(fileOrFolder);
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

function _readSubAggFoldersRecursive(folder, progressCallback, totalCtr) {
    console.log(`_readSubAggFoldersRecursive: ${folder}`);
    let _children = undefined;
    return new Promise(async (resolve, reject) => {
        try {
            fs.readdir(folder, async (err, filesAndSubfolders) => {
                let ctr = 0;
                for (const f of filesAndSubfolders) {
                    if(isNoAggFile(f)) {
                        const fileOrFolder = path.join(folder, f);
                        const type = await typeFromPath(fileOrFolder);
                        if (type === "folder") {
                            const folderValues = await readFolderValues(fileOrFolder);
                            const [children, subCtr] = await _readSubAggFoldersRecursive(fileOrFolder, progressCallback, totalCtr);
                            _children = _children ? _children : []
                            _children.push({...folderValues, name: f, value: subCtr, children});
                        } else {
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

function _countFilesRecursive(absFolder) {
    return new Promise(async (resolve, reject) => {
        try {
            fs.readdir(absFolder, async (err, filesAndSubfolders) => {
                let ctr = 0;
                for (const f of filesAndSubfolders) {
                    const subFolder = path.join(absFolder, f);
                    const type = await typeFromPath(subFolder);
                    if (type === "folder") {
                        ctr += await _countFilesRecursive(subFolder)
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

function initNumberOfFiles(absFolder) {
    return new Promise(async resolve => {
        numberOfFiles = await _countFilesRecursive(absFolder);
        resolve(numberOfFiles);
    })
}

function getNumberOfFiles() {
    return numberOfFiles;
}

function readSubAggFolders(relFolder, basePath, progressCallback) {
    return new Promise(async (resolve, reject) => {
        try {
            const absFolder = path.join(basePath, TFIDF_FOLDER, relFolder);
            const [children] = await _readSubAggFoldersRecursive(absFolder, progressCallback, {ctr: 0});
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

const initStopwords = (stopwordspath) => {
    if(fs.existsSync(stopwordspath)) {
        const stopwordsStr = fs.readFileSync(stopwordspath);
        stopwords = JSON.parse(stopwordsStr);
    }
}

module.exports = {
    readAggFolder, readSrcFolder2, TFIDF_EXTENSION, readSubAggFolders,
    initStopwords, saveStopwords, filterStopwordsAndUnstem, stopwords, initNumberOfFiles, getNumberOfFiles,
    readAllValuesForOneFeature, typeFromPath
}
