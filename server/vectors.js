var math = require('mathjs');

const {createReadlineInterface} = require("./fileUtil");

const vectors = {};

const computeCosineBetweenVectors = (vector1, vector2) => {
    const cosine = math.multiply(vector1, vector2) / (math.norm(vector1) * math.norm(vector2));
    return cosine;
}

const initVectors = (vectorspath) => {

    return new Promise(resolve => {
        const readlineInterface = createReadlineInterface(vectorspath);
        readlineInterface.on("line", line => {
            const parts = line.split("\t");
            const filename = parts[0];
            const vector = parts.slice(1);
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

module.exports = {initVectors, cosine}
