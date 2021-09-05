var math = require('mathjs');

const {createReadlineInterface} = require("./fileUtil");

const computeCosineBetweenVectors = (vector1, vector2) => {
    if(vector1.length === vector2.length) {
        return math.multiply(vector1, vector2) / (math.norm(vector1) * math.norm(vector2));
    }

    return 0;
}

let vectorspath;
let numberOfVectors;
const initVectorspath = (_vectorspath) => {
    vectorspath = _vectorspath;
    numberOfVectors = 0;
    return new Promise(resolve => {
        const readlineInterface = createReadlineInterface(_vectorspath);
        readlineInterface.on("line", () => {
            numberOfVectors++;
        }).on("close", () => {
            resolve();
        })
    })
}

const findVector = (doc, progressCallback) => {
    let lineCtr = 0;
    return new Promise((resolve, reject) => {
        const rl = createReadlineInterface(vectorspath);
        let found = false;
        rl.on("line", line => {
            const parts = line.split("\t");
            if(doc === parts[0]) {
                found = true;
                rl.close();
                resolve(parts.slice(1).map(Number));
            }
            if(++lineCtr % 100 == 0) {
                progressCallback(`Finding vector/${lineCtr}/${numberOfVectors}`);
            }
        }).on("close", () => {
            if(!found) {
                reject(`can't find ${doc}`);
            }
        })
    })
}

const similarDocsFromFileWithProgress = async (doc1, threshold, progressCallback) => {
    const doc1Vector = await findVector(doc1, progressCallback);
    const resultList = [];
    let lineCtr = 0;
    return new Promise(resolve => {
        createReadlineInterface(vectorspath).on("line", line => {
            const parts = line.split("\t");
            const doc2 = parts[0];
            if(doc1 !== doc2) {
                const doc2Vector = parts.slice(1).map(Number);
                const cosine = computeCosineBetweenVectors(doc1Vector, doc2Vector);
                if(cosine > threshold) {
                    resultList.push({document: doc2, cosine})
                }
            }
            if(++lineCtr % 100 == 0) {
                progressCallback(`Computing cosines/${lineCtr}/${numberOfVectors}`);
            }
        }).on("close", () => {
            resolve(resultList);
        })
    })
}

module.exports = {initVectorspath, similarDocsFromFileWithProgress}
