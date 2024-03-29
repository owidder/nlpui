const path = require("path");
const fs = require("fs");

const LONG_WORDS_SUFFIX = "_long_words_";

let unstemDict;
let reversedUnstemDict;

const readUnstemDict = (datapath) => {
    const unstemDictPath = path.join(datapath, "unstem_dict.json");
    if(fs.existsSync(unstemDictPath)) {
        const unstemDictJson = fs.readFileSync(unstemDictPath);
        return JSON.parse(unstemDictJson);
    }

    return {}
}

const unstem = (word, datapath, relFileOrFolder) => {
    const unstemmed = unstemDict[word] ? unstemDict[word] : [word];

    if(datapath != undefined && relFileOrFolder != undefined) {
        return filterLongWordsForFolder(unstemmed,datapath, relFileOrFolder)
    } else {
        return unstemmed
    }
}

const initUnstemDict = (datapath) => {
    unstemDict = readUnstemDict(datapath);
}

const longWordsOfFolderCache = {};

const readLongWordsOfFileOrFolder = (datapath, relFileOrFolder) => {
    if(longWordsOfFolderCache[relFileOrFolder] == null) {
        const absPath = path.join(datapath, "words", relFileOrFolder, relFileOrFolder.endsWith("_long_words_") ? "" : "_._long_words_of_folder");
        const longWordsOfFolderBuffer = fs.readFileSync(absPath);
        longWordsOfFolderCache[relFileOrFolder] = String(longWordsOfFolderBuffer).replaceAll("\n", "").split(" ");
    }
    return longWordsOfFolderCache[relFileOrFolder];
}

const filterLongWordsForFolder = (words, datapath, relFileOrFolder) => {
    const longWordsOfFolder = readLongWordsOfFileOrFolder(datapath, relFileOrFolder)
    return words.filter(w => longWordsOfFolder.indexOf(w) > -1);
}

const readLongWordsOfSourceFile = (datapath, relSourceFile) => {
    return readLongWordsOfFileOrFolder(datapath, `${relSourceFile}.${LONG_WORDS_SUFFIX}`)
}

const unstemWordsAndValues = (wordsAndValues, datapath, relFileOrFolder) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(wordsAndValues.map(wav => {
                const wavNew = {...wav, stem: wav.word, words: unstem(wav.word, datapath, relFileOrFolder)};
                delete wavNew.word;

                return wavNew
            }))
        })
    })
}

const stemFromUnstem = (unstemmed) => reversedUnstemDict[unstemmed] ? reversedUnstemDict[unstemmed] : unstemmed;

module.exports = {unstem, stemFromUnstem, initUnstemDict, unstemWordsAndValues, readLongWordsOfSourceFile}
