const {createReadlineInterface} = require("./fileUtil");

const TFIDF_EXTENSION = "tfidf.csv";
const TFIDF_FOLDER = "tfidf";

const readFeatures = (path) => {
    const pathWithCorrectExtension = path.endsWith(TFIDF_EXTENSION) ? path : `${path}.${TFIDF_EXTENSION}`;
    return new Promise(resolve => {
        const result = [];
        const readlineInterface = createReadlineInterface(pathWithCorrectExtension);
        readlineInterface.on("line", line => {
            const parts = line.split("\t");
            const feature = parts[0];
            const value = Number(parts[1]);
            result.push({feature, value})
        }).on("close", () => {
            resolve(result);
        })
    })

}

module.exports = {readFeatures, TFIDF_EXTENSION, TFIDF_FOLDER}
