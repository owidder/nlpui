const path = require("path");
const fs = require("fs");

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

const unstem = (word, datapath, relFolder) => {
    const unstemmed = unstemDict[word] ? unstemDict[word] : [word];

    if(datapath != undefined && relFolder != undefined) {
        return filterLongWordsForFolder(unstemmed,datapath, relFolder)
    } else {
        return unstemmed
    }
}

const initUnstemDict = (datapath) => {
    unstemDict = readUnstemDict(datapath);
}

const readLongWordsOfFolder = (datapath, relFolder) => {
    const absPath = path.join(datapath, "words", relFolder, "_._long_words_of_folder");
    const longWordsOfFolderBuffer = fs.readFileSync(absPath);
    return String(longWordsOfFolderBuffer).replaceAll("\n", "").split(" ");
}

const filterLongWordsForFolder = (words, datapath, relFolder) => {
    const longWordsOfFolder = readLongWordsOfFolder(datapath, relFolder)
    return words.filter(w => longWordsOfFolder.indexOf(w) > -1);
}

const unstemWordsAndValues = (wordsAndValues, datapath, relFolder) => {
    return  wordsAndValues.map(wav => {
        const wavNew = {...wav, stem: wav.word, words: unstem(wav.word, datapath, relFolder)};
        delete wavNew.word;

        return wavNew
    })
}

const stemFromUnstem = (unstemmed) => reversedUnstemDict[unstemmed] ? reversedUnstemDict[unstemmed] : unstemmed;

module.exports = {unstem, stemFromUnstem, initUnstemDict, unstemWordsAndValues}
