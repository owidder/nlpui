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

const unstem = (word) => unstemDict[word] ? unstemDict[word] : word;

const initUnstemDict = (datapath) => {
    unstemDict = readUnstemDict(datapath);
}

const unstemWordsAndValues = (wordsAndValues) => {
    return  wordsAndValues.map(wav => {
        const wavNew = {...wav, stem: wav.word, words: unstem(wav.word)};
        delete wavNew.word;

        return wavNew
    })
}

const stemFromUnstem = (unstemmed) => reversedUnstemDict[unstemmed] ? reversedUnstemDict[unstemmed] : unstemmed;

module.exports = {unstem, stemFromUnstem, initUnstemDict, unstemWordsAndValues}
