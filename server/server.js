const path = require("path");
const fs = require("fs");
const express = require("express");
const bodyParser = require('body-parser');
const readline = require("readline");
const postal = require("postal");

const app = express();
const router = express.Router();
app.use(bodyParser.json());
app.use("/", express.static(__dirname + "/build"));

const server = require("http").createServer(app);

const SUMMARY_FILENAME = '_.csv';
const BASE_FOLDER = "/Users/oliver/dev/github/nlp/out";
const VALUE_FILE_SUFFIX = ".tfidf.csv";
const FAKE_SUMMARY_FILENAME = '_SUMMARY_';
const TERM_INFOS_REL_PATH = "./termInfos.csv";

const ignoreTerms = [];
const terms = [];
const termInfos = {};

function isSummaryFile(filename) {
    return filename == SUMMARY_FILENAME;
}

function isValueFile(filename) {
    return isSummaryFile(filename) || filename.endsWith(VALUE_FILE_SUFFIX);
}

function sortNonCaseSensitive(list) {
    return list.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
}

function adaptValueFilename(filename) {
    if(isSummaryFile(filename)) {
        return FAKE_SUMMARY_FILENAME;
    }
    return filename.substr(0, filename.length - VALUE_FILE_SUFFIX.length);
}

function isFakeSummaryFilePath(filePath) {
    return filePath.endsWith(FAKE_SUMMARY_FILENAME);
}

function backAdaptValueFilePath(filePath) {
    if(isFakeSummaryFilePath(filePath)) {
        return filePath.substr(0, filePath.length - FAKE_SUMMARY_FILENAME.length) + SUMMARY_FILENAME;
    }
    return filePath + VALUE_FILE_SUFFIX;
}

function adaptNamesRecursive(filesAndSubfolderNameList, absFolder, adaptedList, currentIndex, resolve, reject) {
    if(currentIndex < filesAndSubfolderNameList.length) {
        const fileOrSubfolderName = filesAndSubfolderNameList[currentIndex];
        fs.stat(path.join(absFolder, fileOrSubfolderName), (err, stats) => {
            if(err) reject(err);
            if(stats.isDirectory()) {
                adaptedList.push(fileOrSubfolderName + "/")
            } else {
                adaptedList.push(adaptValueFilename(fileOrSubfolderName))
            }
            adaptNamesRecursive(filesAndSubfolderNameList, absFolder, adaptedList, currentIndex+1, resolve, reject);
        })
    } else {
        resolve(adaptedList)
    }
}

function adaptNames(filesAndSubfolderNameList, absFolder) {
    return new Promise((resolve, reject) => {
        adaptNamesRecursive(filesAndSubfolderNameList, absFolder, [], 0, resolve, reject)
    })
}

function readFolder(relFolder) {
    const absFolder = path.join(BASE_FOLDER, relFolder);
    return new Promise((resolve, reject) => {
        fs.readdir(absFolder, async (err, filesAndSubfolders) => {
            if(err) reject(err);
            const onlyFoldersAndValueFiles =  await filterNonValueFiles(filesAndSubfolders, absFolder);
            const adaptedNames = await adaptNames(onlyFoldersAndValueFiles, absFolder)
            resolve(sortNonCaseSensitive(adaptedNames));
        });
    })
}

function filterNonValueFilesRecursive(filesAndSubfolderNameList, absFolder, filteredList, currentIndex, resolve, reject) {
    if(currentIndex < filesAndSubfolderNameList.length) {
        const fileOrSubfolderName = filesAndSubfolderNameList[currentIndex];
        if(isValueFile(fileOrSubfolderName)) {
            filteredList.push(fileOrSubfolderName);
            filterNonValueFilesRecursive(filesAndSubfolderNameList, absFolder, filteredList, currentIndex+1, resolve, reject)
        } else {
            fs.stat(path.join(absFolder, fileOrSubfolderName), (err, stats) => {
                if(err) reject(err);
                if(stats.isDirectory()) {
                    filteredList.push(fileOrSubfolderName)
                }
                filterNonValueFilesRecursive(filesAndSubfolderNameList, absFolder, filteredList, currentIndex+1, resolve, reject)
            })
        }
    } else {
        resolve(filteredList)
    }
}

function filterNonValueFiles(filesAndSubfolderNameList, absFolder) {
    return new Promise((resolve, reject) => {
        filterNonValueFilesRecursive(filesAndSubfolderNameList, absFolder, [], 0, resolve, reject)
    })
}

function pathTypeFromStats(stats) {
    return stats.isDirectory() ? "folder" : "file";
}

function getPathType(relPath) {
    const absPath = path.join(BASE_FOLDER, relPath);
    return new Promise((resolve, reject) => {
        fs.stat(absPath, (err1, stats1) => {
            if(err1 == null) {
                resolve(pathTypeFromStats(stats1))
            } else {
                fs.stat(backAdaptValueFilePath(absPath), (err2, stats2) => {
                    if(err2 == null) {
                        resolve(pathTypeFromStats(stats2))
                    } else {
                        resolve("NA")
                    }
                })
            }
        })
    })
}

function readContent(relPath) {
    const absPath = backAdaptValueFilePath(path.join(BASE_FOLDER, relPath));
    return new Promise((resolve, reject) => {
        fs.readFile(absPath, "utf8", (err, data) => {
            if(err) reject(err);
            resolve(data)
        });
    })
}

const createReadlineInterface = (path) => {
    return readline.createInterface({
        input: fs.createReadStream(path),
        output: process.stdout,
        console: false
    });
}

function initTermInfos() {
    return new Promise(resolve => {
        if(fs.existsSync(TERM_INFOS_REL_PATH)) {
            const readlineInterface = createReadlineInterface("./termInfos.csv");
            readlineInterface.on("line", termInfoCsvRow => {
                const parts = termInfoCsvRow.split(";");
                const termName = parts[0];
                const plusOrMinus = parts[1];
                termInfos[termName] = {plusOrMinus};
            }).on("close", resolve);
        } else {
            resolve()
        }
    })
}

const setTermInfo = (termName, plusOrMinus) => {
    if(termInfos[termName]) {
        termInfos[termName].plusOrMinus = plusOrMinus;
    } else {
        termInfos[termName] = {plusOrMinus};
    }
}

const readTerms = (relPath) => {
    const absPath = backAdaptValueFilePath(path.join(BASE_FOLDER, relPath));
    const terms = [];
    return new Promise((resolve, reject) => {
        const readlineInterface = createReadlineInterface(absPath);
        readlineInterface.on("line", line => {
            const parts = line.split("\t");
            const term = parts[0];
            const tfidfValue = Number(parts[1]).toFixed(2);
            const plusOrMinus = termInfos[term] ? termInfos[term].plusOrMinus : "?";
            terms.push({term, tfidfValue, plusOrMinus});
        }).on("close", () => {
            resolve(terms);
        })
    })
}

const saveTermInfos = () => {
    fs.writeFileSync(TERM_INFOS_REL_PATH, "");
    Object.keys(termInfos).forEach(termName => {
        fs.appendFileSync(TERM_INFOS_REL_PATH, `${termName};${termInfos[termName].plusOrMinus}\n`);
    })
}

router.put("/termInfo/save", (req, res) => {
    saveTermInfos();
    res.json({result: "OK"});
})

router.post("/termInfo/:term/set", (req, res) => {
    const {term} = req.params;
    const {plusOrMinus} = req.body;
    console.log(`set: ${term} = ${plusOrMinus}`);
    setTermInfo(term, plusOrMinus);
    res.json({term, plusOrMinus});
})

router.get("/termInfo/:term", (req, res) => {
    const {term} = req.params;
    const plusOrMinus = termInfos[term] ? termInfos[term].plusOrMinus : "?";
    res.json({term, plusOrMinus});
})

router.get("/folder/*", async function (req, res) {
    const relFolder = req.originalUrl.substr("/api/folder".length+1);
    console.log(`folder: ${relFolder}`);
    const content = await readFolder(relFolder)
    res.json({folder: relFolder, content});
});

router.get("/file/*", async function (req, res) {
    const relPath = req.originalUrl.substr("/api/file".length+1);
    console.log(`file: ${relPath}`);
    const content = await readContent(relPath);
    res.json({path: relPath, content});
});

router.get("/file2/*", async function (req, res) {
    const relPath = req.originalUrl.substr("/api/file".length+1);
    console.log(`file: ${relPath}`);
    const terms = await readTerms(relPath);
    res.json({path: relPath, terms});
});

router.get("/pathType/*", async function (req, res) {
    const relPath = req.originalUrl.substr("/api/pathType".length+1);
    const pathType = await getPathType(relPath);
    console.log(`pathType: ${relPath} -> ${pathType}`);
    res.json({path: relPath, pathType});
});

app.use('/api', router);

initTermInfos().then(() => {
    server.listen(3100, function () {
        console.log("server for nlp-client is listening on port 3100")
    });
})
