const path = require("path");
const math = require('mathjs');
const NodeCache = require("node-cache");

const {writeProgressText, writeMaxProgress, writeProgress, writeJsonz, deleteEventEmitterFromMap, subscribeToEventEmitter} = require("./stream");
const {randomNumberBetween} = require("./miscUtil");

const {createReadlineInterface} = require("./fileUtil");
const {readFeatures, compareToFeature} = require("./tfidf");
const {unstem} = require("./unstem");

const computeCosineBetweenVectors = (vector1, vector2) => {
    if(vector1.length === vector2.length) {
        return math.multiply(vector1, vector2) / (math.norm(vector1) * math.norm(vector2));
    }

    return 0;
}

const resultCache = new NodeCache();

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

const findVector = async (doc, eventEmitter) => {
    console.log(`findVector: ${doc}`);
    await writeProgressText(eventEmitter, "Finding vector");
    await writeMaxProgress(eventEmitter, numberOfVectors);
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
                await writeProgress(eventEmitter, lineCtr);
            }
        }).on("close", () => {
            if(!found) {
                reject(`can't find ${doc}`);
            }
        })
    })
}

const findTfidfValueOfFeature = async (docPath, feature) => {
    if(feature) {
        const allFeatures = await readFeatures(docPath);
        const indexOfFeature = allFeatures.findIndex(f => compareToFeature(unstem(f.feature), feature));
        return indexOfFeature > -1 ? allFeatures[indexOfFeature].value : undefined;
    }
}

const addTfidfValuesOfFeature = (resultList, feature, basePath) => {
    const resultListWithFeatureValues = [];
    return new Promise(async resolve => {
        for(let i = 0; i < resultList.length; i++) {
            const _r = resultList[i];
            const tfidfValueOfFeature = await findTfidfValueOfFeature(path.join(basePath, _r.document), feature);
            resultListWithFeatureValues.push({..._r, tfidfValueOfFeature});
        }
        resolve(resultListWithFeatureValues)
    })
}

const similarDocsFromFileWithProgress = async (doc1, threshold, res, maxDocs, featureToSearchFor, basePath) => {
    console.log(`similarDocsFromFileWithProgress: ${doc1}`);
    const cachedResult = resultCache.get(doc1);

    const eventEmitter = subscribeToEventEmitter("vector", res, doc1);

    if(cachedResult) {
        const cachedResultList = JSON.parse(cachedResult);
        const cachedResultListWithFeatureValues = await addTfidfValuesOfFeature(cachedResultList, featureToSearchFor, basePath);
        return writeJsonz(eventEmitter, JSON.stringify(cachedResultListWithFeatureValues));
    } else {
        if(eventEmitter.isNew) {
            eventEmitter.isNew = false;
            const doc1Vector = await findVector(doc1, eventEmitter);
            await writeMaxProgress(eventEmitter, numberOfVectors);
            await writeProgressText(eventEmitter, "Computing cosines");

            const resultList = [{document: doc1, cosine: 1}];
            let lineCtr = 0;
            return new Promise(resolve => {
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
                        await writeProgress(eventEmitter, lineCtr);
                    }
                }).on("close", async () => {
                    const sortedResultList = resultList.sort((a, b) => b.cosine - a.cosine).slice(0, maxDocs);
                    const result = JSON.stringify(sortedResultList);
                    resultCache.set(doc1, result);
                    const sortedResultListWithFeatureValues = await addTfidfValuesOfFeature(sortedResultList, featureToSearchFor, basePath);
                    deleteEventEmitterFromMap("vector", doc1);
                    await writeJsonz(eventEmitter, JSON.stringify(sortedResultListWithFeatureValues));
                    resolve();
                })
            })
        }
    }
}

module.exports = {initVectorspath, similarDocsFromFileWithProgress, getNumberOfVectors}
