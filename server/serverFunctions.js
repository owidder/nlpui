const path = require("path");
const fs = require("fs");
const _ = require("lodash");

const {readFeatures, TFIDF_EXTENSION, TFIDF_FOLDER, compareToFeature, IGNORED_TFIDF_EXTENSIONS} = require("./tfidf");

const {createReadlineInterface} = require("./fileUtil");
const {unstem, unstemWordsAndValues} = require("./unstem");
const {hasVector} = require("./vectors");

const AGG_CSV = "_.csv";
const IGNORED_AGG_CSV = ["_all.csv", "_2.csv"];

const isNoAggFile = f => !(f === AGG_CSV || IGNORED_AGG_CSV.indexOf(f) > -1);

const SUM_INDEX = 5
const MAX_INDEX = 6
const COUNT_INDEX = 3
const AVG_INDEX = 7

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
                && IGNORED_TFIDF_EXTENSIONS.filter(ext => fileOrSubfolder.endsWith(ext)).length == 0) {
                filtered.push(fileOrSubfolder)
            }
        } else {
            filtered.push(fileOrSubfolder)
        }
    }

    return filtered
}

const createAdvanceEntries = async (filesAndSubfolderNames, absRoot, relFolder) => {
    const advancedEntries = []
    for(const fileOrSubfolderName of filesAndSubfolderNames) {
        const advancedEntry = {name: fileOrSubfolderName}
        const relFileOrSubfolder = path.join(relFolder, fileOrSubfolderName);
        const absFileOrSubfolder = path.join(absRoot, relFileOrSubfolder);
        advancedEntry.type = await typeFromPath(absFileOrSubfolder);
        if(advancedEntry.type == "file") {
            if(hasVector(relFileOrSubfolder)) {
                advancedEntry.hasVector = true;
            }
        }
        advancedEntries.push(advancedEntry);
    }

    return advancedEntries
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

function readSrcFolder3(absRoot, relFolder) {
    const absFolder = path.join(absRoot, relFolder);
    return new Promise((resolve, reject) => {
        fs.readdir(absFolder, async (err, filesAndSubfolderNames) => {
            if (err) reject(err);

            const filtered = await filterFolders(filesAndSubfolderNames, absFolder);
            const withoutTfIdfExtension = filtered.map(removeTfIdfExtension);
            const advancedEntries = createAdvanceEntries(sortNonCaseSensitive(withoutTfIdfExtension), absRoot, relFolder);
            resolve(advancedEntries);
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
                const value = Number(wordAndValues[SUM_INDEX])
                wordsAndValues.push({word: wordAndValues[0], sum: _.round(wordAndValues[SUM_INDEX], 2),
                    count: Number(wordAndValues[COUNT_INDEX]),
                    max: _.round(wordAndValues[MAX_INDEX], 2),
                    avg: _.round(wordAndValues[AVG_INDEX], 2),
                    "max*count": _.round(wordAndValues[MAX_INDEX] * wordAndValues[COUNT_INDEX], 2), value});
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
                        const indexOfFeature = folderValues.words.findIndex(w => compareToFeature(w, feature));
                        if(indexOfFeature > -1) {
                            values[f] = {
                                sum: folderValues.sumValues[indexOfFeature],
                                avg: folderValues.avgValues[indexOfFeature],
                                max: folderValues.maxValues[indexOfFeature],
                                "max*count": folderValues.maxCountValues[indexOfFeature],
                                count: folderValues.countValues[indexOfFeature]
                            }
                        }
                    } else {
                        const fileValues = await readFeatures(fileOrFolder);
                        const unstemmedFileValues = fileValues.map(({feature, value}) => {
                            return {feature: unstem(feature), value}
                        });
                        const indexOfFeature = unstemmedFileValues.findIndex(fv => compareToFeature(fv.feature, feature));
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

module.exports = {readAggFolder, readSrcFolder2, TFIDF_EXTENSION, readSubAggFolders, readAllValuesForOneFeature, typeFromPath, readSrcFolder3}
