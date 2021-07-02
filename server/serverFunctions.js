const path = require("path");
const fs = require("fs");

function sortNonCaseSensitive(list) {
    return list.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
}

function pathTypeFromStats(stats) {
    return stats.isDirectory() ? "folder" : "file";
}

function getPathType(relPath, basePath) {
    const absPath = path.join(basePath, relPath);
    return new Promise((resolve, reject) => {
        fs.stat(absPath, (err, stats) => {
            if (err) reject(err);
            resolve(pathTypeFromStats(stats))
        })
    })
}

const filterFoldersAndUtf8 = async (filesAndSubfolders, relPath, basePath) => {
    const filtered = []
    for(const fileOrSubfolder of filesAndSubfolders) {
        const pathType = await getPathType(`${relPath}/${fileOrSubfolder}`, basePath)
        if(pathType === "file") {
            if(fileOrSubfolder.endsWith(".utf8") && !fileOrSubfolder.startsWith("__") && !fileOrSubfolder.startsWith(".")) {
                filtered.push(fileOrSubfolder)
            }
        } else {
            filtered.push(fileOrSubfolder)
        }
    }

    return filtered
}

function readSrcFolder(relFolder, basePath) {
    const absFolder = path.join(basePath, relFolder);
    return new Promise((resolve, reject) => {
        fs.readdir(absFolder, async (err, filesAndSubfolders) => {
            const filtered = await filterFoldersAndUtf8(filesAndSubfolders, relFolder, basePath);
            if (err) reject(err);
            resolve(sortNonCaseSensitive(filtered));
        });
    })
}

module.exports = {readSrcFolder, getPathType}