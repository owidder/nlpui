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

const unstemWordsAndValues = (wordsAndValues) => {
    return  wordsAndValues.map(wav => {
        return {...wav, word: unstem(wav.word)}
    })
}

const stemFromUnstem = (unstemmed) => reversedUnstemDict[unstemmed] ? reversedUnstemDict[unstemmed] : unstemmed;

module.exports = {unstem, stemFromUnstem, initUnstemDict, unstemWordsAndValues}
