var math = require('mathjs');
const {writeProgressText, writeMaxProgress, writeProgress, writeJsonz} = require("./stream");
const {randomNumberBetween} = require("./miscUtil");

const {createReadlineInterface} = require("./fileUtil");

const computeCosineBetweenVectors = (vector1, vector2) => {
    if(vector1.length === vector2.length) {
        return math.multiply(vector1, vector2) / (math.norm(vector1) * math.norm(vector2));
    }

    return 0;
}

let vectorspath;
let numberOfVectors;

const getNumberOfVectors = () => {
    return numberOfVectors;
}

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

const findVector = async (doc, res) => {
    await writeProgressText(res, "Finding vector");
    await writeMaxProgress(res, numberOfVectors);
    let lineCtr = 0;
    return new Promise((resolve, reject) => {
        const rl = createReadlineInterface(vectorspath);
        let found = false;
        rl.on("line", async line => {
            const parts = line.split("\t");
            if(doc === parts[0]) {
                found = true;
                rl.close();
                resolve(parts.slice(1).map(Number));
            }
            if(++lineCtr % randomNumberBetween(100, 110) == 0) {
                await writeProgress(res, lineCtr);
            }
        }).on("close", () => {
            if(!found) {
                reject(`can't find ${doc}`);
            }
        })
    })
}

const similarDocsFromFileWithProgress = async (doc1, threshold, res, maxDocs) => {
    const doc1Vector = await findVector(doc1, res);
    await writeMaxProgress(res, numberOfVectors);
    await writeProgressText(res, "Computing cosines");
    const resultList = [];
    let lineCtr = 0;
    return new Promise(() => {
        createReadlineInterface(vectorspath).on("line", async line => {
            const parts = line.split("\t");
            const doc2 = parts[0];
            if(doc1 !== doc2) {
                const doc2Vector = parts.slice(1).map(Number);
                const cosine = computeCosineBetweenVectors(doc1Vector, doc2Vector);
                if(cosine > threshold) {
                    resultList.push({document: doc2, cosine})
                }
            }
            if(++lineCtr % randomNumberBetween(100, 110) == 0) {
                 await writeProgress(res, lineCtr);
            }
        }).on("close", async () => {
            await writeJsonz(res, JSON.stringify(resultList.slice(0, maxDocs)));
        })
    })
}

module.exports = {initVectorspath, similarDocsFromFileWithProgress, getNumberOfVectors}
