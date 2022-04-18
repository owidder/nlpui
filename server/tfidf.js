const {access, constants} = require("fs");

const {createReadlineInterface} = require("./fileUtil");

const TFIDF_EXTENSION = "tfidf.csv";
const TFIDF_FOLDER = "tfidf";
const IGNORED_TFIDF_EXTENSIONS = ["tfidf_all.csv", "tfidf2.csv"]

const readFeatures = (path) => {
    const pathWithCorrectExtension = path.endsWith(TFIDF_EXTENSION) ? path : `${path}.${TFIDF_EXTENSION}`;
    return new Promise(resolve => {
        access(pathWithCorrectExtension, constants.F_OK, err => {
            if(err) {
                resolve([]);
            } else {
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
            }
        })
    })
}

const compareToFeature = (word, feature) => {
    return (word.toLowerCase() == feature.toLowerCase());
}


module.exports = {readFeatures, TFIDF_EXTENSION, TFIDF_FOLDER, compareToFeature, IGNORED_TFIDF_EXTENSIONS}
