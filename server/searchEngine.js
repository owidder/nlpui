const path = require("path");
const fs = require("fs");

const {typeFromPathWithDefaultExtension} = require("./fileUtil");
const {readFeatures} = require("./tfidf");
const {readLongWordsOfSourceFile, unstem} = require("./unstem");

let stemIndex = {constructor: []};

const addToIndex = async (relFilePath, index, baseFolder) => {
    const absFilePath = path.join(baseFolder, relFilePath);
    const wordsWithValues = await readFeatures(absFilePath);

    wordsWithValues.forEach(wwv => {
        const entry = {document: relFilePath, cosine: wwv.value, tfidfValueOfFeature: wwv.value};
        if(index[wwv.feature]) {
            index[wwv.feature].push(entry)
        } else {
            index[wwv.feature] = [entry]
        }
    })
}

const _createStemIndexRecursive = (index, relFolder, extension, baseFolder) => {
    console.log(Object.keys(index).length);
    return new Promise(async (resolve, reject) => {
        try {
            const absFolder = path.join(baseFolder, relFolder);
            fs.readdir(absFolder, async (err, filesAndSubfolders) => {
                for (const f of filesAndSubfolders) {
                    const absFileOrFolder = path.join(absFolder, f);
                    const relFileOrFolder = path.join(relFolder, f);
                    const type = await typeFromPathWithDefaultExtension(absFileOrFolder);
                    if(type === "folder") {
                        await _createStemIndexRecursive(index, relFileOrFolder, extension, baseFolder);
                    } else if(f.endsWith(extension)) {
                        const fileWithoutExtension = relFileOrFolder.substring(0, relFileOrFolder.indexOf(extension));
                        await addToIndex(fileWithoutExtension, index, baseFolder);
                    }
                }
                resolve()
            });
        } catch (e) {
            reject(e)
        }
    })
}

const createStemIndex = async (relFolder, extension, baseFolder) => {
    await _createStemIndexRecursive(stemIndex, relFolder, extension, baseFolder);
}

const searchStem = (stem) => {
    return stemIndex[stem]
}

const searchStemInPath = (stem, _path) => {
    const allResults = searchStem(stem);
    return allResults.filter(result => result.document.startsWith(path.join(_path, "/")))
}

const searchStemAndFullWord = (stem, fullWord, datapath) => {
    const allResults = searchStem(stem);
    if(unstem(stem)?.length > 1) {
        return allResults.filter(result => readLongWordsOfSourceFile(datapath, result.document).indexOf(fullWord) > -1);
    } else {
        return allResults;
    }
}

const searchStemAndFullWordInPath = (stem, fullWord, _path, datapath) => {
    return new Promise(resolve => {
        setTimeout(() => {
            const allResults = searchStem(stem);
            const pathFiltered = allResults.filter(result => result.document.startsWith(path.join(_path, "/")));
            const fullWordFiltered = unstem(stem)?.length > 1 ? pathFiltered.filter(result => readLongWordsOfSourceFile(datapath, result.document).indexOf(fullWord) > -1) : pathFiltered;
            resolve(fullWordFiltered)
        })
    })
}

module.exports = {createStemIndex, searchStem, searchStemInPath, searchStemAndFullWord, searchStemAndFullWordInPath}
