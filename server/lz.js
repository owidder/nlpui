const LZUTF8 = require("lzutf8");

const lzData = async (data) => {
    return new Promise((resolve, reject) => {
        LZUTF8.compressAsync(data, {outputEncoding: "Base64"}, (result, error) => {
            if(error) {
                reject(error);
            } else {
                resolve(result)
            }
        })
    })
}

module.exports = {lzData}
