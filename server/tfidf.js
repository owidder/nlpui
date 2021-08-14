const {createReadlineInterface} = require("./fileUtil");

const readFeatures = (path) => {
    return new Promise(resolve => {
        const result = [];
        const readlineInterface = createReadlineInterface(path);
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

module.exports = {readFeatures}
