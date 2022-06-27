const path = require("path");
const fs = require("fs");

const {typeFromPathWithDefaultExtension} = require("./fileUtil");
const {readFeatures} = require("./tfidf");

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

const _createIndexRecursive = (index, relFolder, extension, baseFolder) => {
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
                        await _createIndexRecursive(index, relFileOrFolder, extension, baseFolder);
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
    await _createIndexRecursive(stemIndex, relFolder, extension, baseFolder);
    console.log(stemIndex)
}

const searchStem = (stem) => {
    return stemIndex[stem]
}

const searchStemInPath = (stem, _path) => {
    const allResults = searchStem(stem);
    return allResults.filter(result => result.document.startsWith(path.join(_path, "/")))
}

module.exports = {createIndex: createStemIndex, searchStem, searchStemInPath}
