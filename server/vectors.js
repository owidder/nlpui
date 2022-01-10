const events = require("events");
const math = require('mathjs');
const NodeCache = require("node-cache");

const {writeProgressText, writeMaxProgress, writeProgress, writeJsonz} = require("./stream");
const {randomNumberBetween} = require("./miscUtil");

const {createReadlineInterface} = require("./fileUtil");

const computeCosineBetweenVectors = (vector1, vector2) => {
    if(vector1.length === vector2.length) {
        return math.multiply(vector1, vector2) / (math.norm(vector1) * math.norm(vector2));
    }

    return 0;
}

const resultCache = new NodeCache();
const eventEmitterMap = {};

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

class EventEmitterWithResend extends events.EventEmitter {
    constructor() {
        super();
    }

    eventsToResend = []

    isNew = true
}

const subscribeToEventEmitter = (res, doc) => {
    let eventEmitter = eventEmitterMap[doc];
    if(!eventEmitter) {
        eventEmitter = new EventEmitterWithResend();
        eventEmitter.isNew = true;
        eventEmitterMap[doc] = eventEmitter;
    }

    eventEmitter.on("write", content => {
        res.write(content);
    })

    if(eventEmitter.eventsToResend.length > 0) {
        eventEmitter.eventsToResend.forEach(event => {
            res.write(event)
        })
    }

    return eventEmitter;
}

const similarDocsFromFileWithProgress = async (doc1, threshold, res, maxDocs) => {
    console.log(`similarDocsFromFileWithProgress: ${doc1}`);
    const cachedResult = resultCache.get(doc1);

    const eventEmitter = subscribeToEventEmitter(res, doc1);

    if(cachedResult) {
        return writeJsonz(eventEmitter, cachedResult);
    } else {
        if(eventEmitter.isNew) {
            eventEmitter.isNew = false;
            const doc1Vector = await findVector(doc1, eventEmitter);
            await writeMaxProgress(eventEmitter, numberOfVectors);
            await writeProgressText(eventEmitter, "Computing cosines");
            const resultList = [];
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
                    const sortedResultList = resultList.sort((a, b) => b.cosine - a.cosine);
                    const result = JSON.stringify(sortedResultList.slice(0, maxDocs));
                    resultCache.set(doc1, result);
                    delete eventEmitterMap[doc1];
                    await writeJsonz(eventEmitter, result);
                    resolve();
                })
            })
        }
    }
}

module.exports = {initVectorspath, similarDocsFromFileWithProgress, getNumberOfVectors}
