const {promises: {readdir}, stat} = require('fs');
const path = require("path");
const {createReadlineInterface} = require("./fileUtil");

// Thanks to https://stackoverflow.com/a/24594123
const getAllSubdirs = async (root) => {
    return (await readdir(root, {withFileTypes: true}))
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
}

const readSrcPath = (absFolder) => {
    return new Promise(resolve => {
        const absPathToBaseUrl = path.join(absFolder, "base_url.txt");
        stat(absPathToBaseUrl, async (err) => {
            if(err) {
                resolve("???")
            } else {
                createReadlineInterface(absPathToBaseUrl).on("line", line => {
                    resolve(line)
                }).on("close", () => {
                    resolve("???")
                })
            }
        })
    })
}

const _createScPathMapRecursive = async (subdirs, index, _srcPathMap, root, resolve) => {
    if(subdirs.length > index) {
        const subdir = subdirs[index];
        const srcPath = await readSrcPath(path.join(root, subdir));
        _createScPathMapRecursive(subdirs, index+1, {..._srcPathMap, [subdir]: srcPath}, root, resolve)
    } else {
        resolve(_srcPathMap)
    }
}

const getSrcPathMap = async (root) => {
    const subdirs = await getAllSubdirs(root);
    return new Promise(resolve => {
        _createScPathMapRecursive(subdirs, 0, {}, root, resolve)
    })
}

module.exports = {getSrcPathMap}
