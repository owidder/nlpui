var math = require('mathjs');

const {createReadlineInterface} = require("./fileUtil");

const vectors = {};

const computeCosineBetweenVectors = (vector1, vector2) => {
    if(vector1.length == vector2.length) {
        const cosine = math.multiply(vector1, vector2) / (math.norm(vector1) * math.norm(vector2));
        return cosine;
    }

    return 0;
}

const initVectors = (vectorspath) => {

    return new Promise(resolve => {
        const readlineInterface = createReadlineInterface(vectorspath);
        readlineInterface.on("line", line => {
            const parts = line.split("\t");
            const filename = parts[0];
            const vector = parts.slice(1).map(Number)
            vectors[filename] = vector;
        }).on("close", () => {
            resolve(vectors);
        })
    })
}

const cosine = (doc1Name, doc2Name) => {

    const vector1 = vectors[doc1Name];
    const vector2 = vectors[doc2Name];

    return computeCosineBetweenVectors(vector1, vector2);
}

const similarDocs = (doc1, threshold) => {
    return new Promise(resolve => {
        const docs = Object.keys(vectors).reduce((list, doc2) => {
            if(doc1 == doc2) {
                return list
            }

            const _cosine = cosine(doc1, doc2);
            if(_cosine > threshold) {
                return [...list, {document: doc2, cosine: _cosine}]
            }

            return list
        }, []);
        resolve(docs)
    })
}

module.exports = {initVectors, cosine, similarDocs}
