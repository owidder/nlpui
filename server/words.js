const path = require("path");

const {createReadlineInterface} = require("./fileUtil");
const {isMaybeTechTerm} = require("./techterms");

const splitWord = (word) => {
    const delimRegex = /[/.\-\:\)\(]/;
    if(delimRegex.test(word)) {
        return [word, ...word.split(delimRegex).filter(s => s.length > 0)];
    }
    return [word]
}

const readWords = (basePath, relPath, termInfos) => {
    const absPath = decodeURI(path.join(basePath, relPath));
    const _words = [];
    return new Promise(resolve => {
        const readlineInterface = createReadlineInterface(absPath);
        readlineInterface.on("line", line => {
                const wordsOfLine = line.split(" ");
                _words.push(...wordsOfLine.filter(w => w.length > 0).reduce((l, w) => {
                    return [...l, ...splitWord(w.toLowerCase())]
                }, []));
            }
        ).on("close", () => {
            const uniqueWords = [...new Set(_words)];
            uniqueWords.sort();
            const words = uniqueWords.map(word => {
                const plusOrMinus = termInfos[word] ? termInfos[word].plusOrMinus : "";
                const maybeTechTerm = isMaybeTechTerm(word);
                return {word, plusOrMinus, maybeTechTerm}
            })
            resolve({path: relPath, words});
        })
    })
}

module.exports = {readWords}