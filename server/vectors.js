var math = require('mathjs');

const {createReadlineInterface} = require("./fileUtil");

const vectors = {};

const numberOfVectors = () => Object.keys(vectors).length

const computeCosineBetweenVectors = (vector1, vector2) => {
    if(vector1.length === vector2.length) {
        return math.multiply(vector1, vector2) / (math.norm(vector1) * math.norm(vector2));
    }

    return 0;
}

const initVectors = (vectorspath) => {

    return new Promise(resolve => {
        const readlineInterface = createReadlineInterface(vectorspath);
        readlineInterface.on("line", line => {
            const parts = line.split("\t");
            const filename = parts[0];
            vectors[filename] = parts.slice(1).map(Number);
        }).on("close", () => {
            resolve(vectors);
        })
    })
}

const hasVector = (docName) => {
    return vectors[docName] != null;
}

const cosine = (doc1Name, doc2Name) => {

    const vector1 = vectors[doc1Name];
    const vector2 = vectors[doc2Name];

    if(vector1 != null && vector2 != null) {
        return computeCosineBetweenVectors(vector1, vector2);
    }

    return 0;
}

const sortDocsWithCosines = (docsWiithCosines) => {
    return docsWiithCosines.sort((a, b) => {
        if(a.cosine > b.cosine) return -1;
        if(a.cosine < b.cosine) return 1;
        return 0;
    })
}

const similarDocs = (doc1, threshold = 0) => {
    return new Promise((resolve, reject) => {
        try {
            const docs = Object.keys(vectors).reduce((list, doc2) => {
                if (doc1 === doc2) {
                    return list
                }

                const _cosine = cosine(doc1, doc2);
                if (_cosine > threshold) {
                    return [...list, {document: doc2, cosine: _cosine}]
                }

                return list
            }, []);
            resolve(sortDocsWithCosines(docs))
        } catch (e) {
            reject(e)
        }
    })
}

const _similarDocsWithProgressRecursive = (doc1, threshold, progressCallback, docList, index, resultList, resolve) => {
    if(index < docList.length) {
        const doc2 = docList[index];
        let newResultList = resultList;
        if(doc1 !== doc2) {
            const _cosine = cosine(doc1, doc2);
            if(_cosine > threshold) {
                newResultList = [...resultList, {document: doc2, cosine: _cosine}]
            }
        }
        const recursiveCall = () => _similarDocsWithProgressRecursive(doc1, threshold, progressCallback, docList, index+1, newResultList, resolve);
        if(index % 100 == 0) {
            setTimeout(() => {
                progressCallback(`${index}/${docList.length}`);
                recursiveCall();
            })
        } else {
            recursiveCall();
        }
    } else {
        setTimeout(() => {
            resolve(sortDocsWithCosines(resultList))
        })
    }
}

const similarDocsWithProgress = (doc1, threshold, progressCallback) => {
    return new Promise(resolve => {
        _similarDocsWithProgressRecursive(doc1, threshold, progressCallback, Object.keys(vectors), 0, [], resolve);
    })
}

module.exports = {initVectors, cosine, similarDocs, hasVector, numberOfVectors, similarDocsWithProgress}
