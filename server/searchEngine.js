const path = require("path");
const fs = require("fs");

const {createReadlineInterface, typeFromPathWithDefaultExtension} = require("./fileUtil");

let stemIndex = {constructor: []};

const addLineToIndex = (index, relFilePath, line) => {
    const words = line.split(" ");
    const wordsWithoutDoubles = [...new Set(words)];

    wordsWithoutDoubles.forEach(word => {
        index[word] = index[word] ? [...index[word], relFilePath] : [relFilePath]
    })
}

const addToIndex = (relFilePath, index, baseFolder) => {
    return new Promise(resolve => {
        const absFilePath = path.join(baseFolder, relFilePath);
        const rl = createReadlineInterface(absFilePath);
        rl.on("line", line => {
            addLineToIndex(index, relFilePath, line);
        }).on("close", () => resolve())
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
                        await addToIndex(relFileOrFolder, index, baseFolder);
                    }
                }
                resolve()
            });
        } catch (e) {
            reject(e)
        }
    })
}

const createIndex = async (relFolder, extension, baseFolder) => {
    await _createIndexRecursive(stemIndex, relFolder, extension, baseFolder);
    console.log(stemIndex)
}

module.exports = {createIndex}
