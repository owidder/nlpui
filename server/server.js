const path = require("path");
const fs = require("fs");
const express = require("express");
const bodyParser = require('body-parser');
const readline = require("readline");
const postal = require("postal");
const commandLineArgs = require('command-line-args');

const {initMaybeTechTerms, isMaybeTechTerm} = require("./techterms");
const {createReadlineInterface} = require("./fileUtil");
const {readTopic, readTopicNums, readAllTopics, initWordCounts, getWordCounts} = require("./topics");
const {initVectors, cosine, similarDocs} = require("./vectors");
const {initOnepagers, getOnepager} = require("./onepagers");
const {readWords} = require("./words");

const cliOptionsConfig = [
    {name: "name", alias: "n", type: String},
    {name: "docpath", alias: "d", type: String},
    {name: "srcpath", alias: "s", type: String},
    {name: "outpath", alias: "o", type: String},
    {name: "techpath", alias: "t", type: String},
    {name: "topicspath", alias: "p", type: String},
    {name: "vectorspath", alias: "v", type: String},
    {name: "onepagerspath", alias: "r", type: String},
    {name: "num_topics", alias: "i", type: String},
    {name: "num_entries", alias: "e", type: String},
    {name: "port", type: String},
    {name: "wordspath", alias: "w", type: String},
]

const cliOptions = commandLineArgs(cliOptionsConfig);

const app = express();
const router = express.Router();
app.use(bodyParser.json());
const rootFolder = __dirname + "/../build";
app.use("/", express.static(rootFolder));

const server = require("http").createServer(app);

const SUMMARY_FILENAME = "_.csv";
const VALUE_FILE_SUFFIX = ".tfidf.csv";
const FAKE_SUMMARY_FILENAME = "_SUMMARY_";

const termInfosName = cliOptions.name || "default";
const termInfosRelPath = path.join(cliOptions.outpath || ".", `./termInfos.${termInfosName}.csv`);

const ignoreTerms = [];
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
    if (isSummaryFile(filename)) {
        return FAKE_SUMMARY_FILENAME;
    }
    return filename.substr(0, filename.length - VALUE_FILE_SUFFIX.length);
}

function isFakeSummaryFilePath(filePath) {
    return filePath.endsWith(FAKE_SUMMARY_FILENAME);
}

function backAdaptValueFilePath(filePath) {
    if (isFakeSummaryFilePath(filePath)) {
        return filePath.substr(0, filePath.length - FAKE_SUMMARY_FILENAME.length) + SUMMARY_FILENAME;
    }
    return filePath + VALUE_FILE_SUFFIX;
}

function adaptNamesRecursive(filesAndSubfolderNameList, absFolder, adaptedList, currentIndex, resolve, reject) {
    if (currentIndex < filesAndSubfolderNameList.length) {
        const fileOrSubfolderName = filesAndSubfolderNameList[currentIndex];
        fs.stat(path.join(absFolder, fileOrSubfolderName), (err, stats) => {
            if (err) reject(err);
            if (stats.isDirectory()) {
                adaptedList.push(fileOrSubfolderName + "/")
            } else {
                adaptedList.push(adaptValueFilename(fileOrSubfolderName))
            }
            adaptNamesRecursive(filesAndSubfolderNameList, absFolder, adaptedList, currentIndex + 1, resolve, reject);
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

function readFolder(relFolder, basePath = cliOptions.docpath) {
    const absFolder = path.join(basePath, relFolder);
    return new Promise((resolve, reject) => {
        fs.readdir(absFolder, async (err, filesAndSubfolders) => {
            if (err) reject(err);
            const onlyFoldersAndValueFiles = await filterNonValueFiles(filesAndSubfolders, absFolder);
            const adaptedNames = await adaptNames(onlyFoldersAndValueFiles, absFolder)
            resolve(sortNonCaseSensitive(adaptedNames));
        });
    })
}

function readSrcFolder(relFolder, basePath = cliOptions.srcpath) {
    const absFolder = path.join(basePath, relFolder);
    return new Promise((resolve, reject) => {
        fs.readdir(absFolder, async (err, filesAndSubfolders) => {
            if (err) reject(err);
            resolve(sortNonCaseSensitive(filesAndSubfolders));
        });
    })
}

function filterNonValueFilesRecursive(filesAndSubfolderNameList, absFolder, filteredList, currentIndex, resolve, reject) {
    if (currentIndex < filesAndSubfolderNameList.length) {
        const fileOrSubfolderName = filesAndSubfolderNameList[currentIndex];
        if (isValueFile(fileOrSubfolderName)) {
            filteredList.push(fileOrSubfolderName);
            filterNonValueFilesRecursive(filesAndSubfolderNameList, absFolder, filteredList, currentIndex + 1, resolve, reject)
        } else {
            fs.stat(path.join(absFolder, fileOrSubfolderName), (err, stats) => {
                if (err) reject(err);
                if (stats.isDirectory()) {
                    filteredList.push(fileOrSubfolderName)
                }
                filterNonValueFilesRecursive(filesAndSubfolderNameList, absFolder, filteredList, currentIndex + 1, resolve, reject)
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

const absDocPath = (relPath) => {
    return path.join(cliOptions.docpath, relPath)
}

const absWordsPath = (relPath) => {
    return path.join(cliOptions.wordspath, relPath)
}

function getPathType(relPath, basePath = cliOptions.docpath) {
    const absPath = path.join(basePath, relPath);
    return new Promise((resolve, reject) => {
        fs.stat(absPath, (err1, stats1) => {
            if (err1 == null) {
                resolve(pathTypeFromStats(stats1))
            } else {
                fs.stat(backAdaptValueFilePath(absPath), (err2, stats2) => {
                    if (err2 == null) {
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
    const absPath = backAdaptValueFilePath(absDocPath(relPath));
    return new Promise((resolve, reject) => {
        fs.readFile(absPath, "utf8", (err, data) => {
            if (err) reject(err);
            resolve(data)
        });
    })
}

function initTermInfos() {
    return new Promise(async resolve => {
        await initMaybeTechTerms(cliOptions.techpath);
        if (fs.existsSync(termInfosRelPath)) {
            const readlineInterface = createReadlineInterface(termInfosRelPath);
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
    if (!plusOrMinus) {
        delete termInfos[termName]
    } else {
        if (termInfos[termName]) {
            termInfos[termName].plusOrMinus = plusOrMinus;
        } else {
            termInfos[termName] = {plusOrMinus};
        }
    }

    publishNewTermInfo();
}

const readTerms = (relPath) => {
    const absPath = decodeURI(backAdaptValueFilePath(absDocPath(relPath)));
    const terms = [];
    return new Promise((resolve, reject) => {
        const readlineInterface = createReadlineInterface(absPath);
        readlineInterface.on("line", line => {
            const parts = line.split("\t");
            const term = parts[0];
            const tfidfValue = Number(parts[1]).toFixed(2);
            const plusOrMinus = termInfos[term] ? termInfos[term].plusOrMinus : "";
            const maybeTechTerm = isMaybeTechTerm(term);
            terms.push({term, tfidfValue, plusOrMinus, maybeTechTerm});
        }).on("close", () => {
            resolve(terms);
        })
    })
}

const saveTermInfos = () => {
    fs.writeFileSync(termInfosRelPath, "");
    Object.keys(termInfos).forEach(termName => {
        fs.appendFileSync(termInfosRelPath, `${termName};${termInfos[termName].plusOrMinus}\n`);
    })
}

let saveTermInfosTimer = null;
const subscribeNewTermInfo = () => {
    postal.subscribe({
        channel: "termInfos",
        topic: "newTermInfo",
        callback: () => {
            if (saveTermInfosTimer) {
                clearTimeout(saveTermInfosTimer);
            }
            saveTermInfosTimer = setTimeout(() => {
                saveTermInfos();
                saveTermInfosTimer = null;
            }, 5000)
        }
    })
}

const publishNewTermInfo = () => {
    postal.publish({
        channel: "termInfos",
        topic: "newTermInfo",
    })
}

router.put("/termInfo/save", (req, res) => {
    saveTermInfos();
    res.json({result: "OK"});
})

router.post("/termInfo/:term/set", (req, res) => {
    const {term} = req.params;
    const {plusOrMinus} = req.body;
    setTermInfo(term, plusOrMinus);
    res.json({term, plusOrMinus});
})

router.post("/termInfo/set", (req, res) => {
    const {term} = req.query;
    const {plusOrMinus} = req.body;
    setTermInfo(term, plusOrMinus);
    res.json({term, plusOrMinus});
})

router.get("/termInfo/:term", (req, res) => {
    const {term} = req.params;
    const plusOrMinus = termInfos[term] ? termInfos[term].plusOrMinus : "";
    res.json({term, plusOrMinus});
})

router.get("/termInfos", (req, res) => {
    res.json(termInfos)
})

router.get("/folder/*", async function (req, res) {
    const relFolder = req.originalUrl.substr("/api/folder".length + 1);
    console.log(`folder: ${relFolder}`);
    const content = await readFolder(relFolder)
    res.json({folder: relFolder, content});
});

router.get("/src/folder/*", async function (req, res) {
    const relFolder = req.originalUrl.substr("/api/src/folder".length + 1);
    const content = await readSrcFolder(relFolder, cliOptions.srcpath)
    res.json({folder: relFolder, content});
});

router.get("/words/folder/*", async function (req, res) {
    const relFolder = req.originalUrl.substr("/api/words/folder".length + 1);
    const content = await readSrcFolder(relFolder, cliOptions.wordspath);
    res.json({folder: relFolder, content});
});

router.get("/topic/:num_topics/:topic_num", async (req, res) => {
    const {num_topics, topic_num} = req.params;
    const topic = await readTopic(cliOptions.topicspath, num_topics, topic_num);
    res.json(topic);
})

router.get("/allTopics/:num_topics/:num_entries", async (req, res) => {
    const {num_topics, num_entries} = req.params;
    const allTopics = await readAllTopics(cliOptions.topicspath, num_topics, num_entries);
    res.json(allTopics);
})

router.get("/topicNums", async (req, res) => {
    const topicNums = await readTopicNums(cliOptions.topicspath);
    res.json(topicNums);
})

router.get("/file/*", async function (req, res) {
    const relPath = req.originalUrl.substr("/api/file".length + 1);
    console.log(`file: ${relPath}`);
    const content = await readContent(relPath);
    res.json({path: relPath, content});
});

router.get("/file2/*", async function (req, res) {
    const relPath = req.originalUrl.substr("/api/file2".length + 1);
    console.log(`file: ${relPath}`);
    const terms = await readTerms(relPath);
    res.json({path: relPath, terms});
});

router.get("/words/file/*", async (req, res) => {
    const relPath = req.originalUrl.substr("/api/words/file".length + 1);
    const words = await readWords(cliOptions.wordspath, relPath, termInfos);
    res.json(words);
})

router.get("/pathType/*", async function (req, res) {
    const relPath = decodeURI(req.originalUrl.substr("/api/pathType".length + 1));
    const pathType = await getPathType(relPath);
    console.log(`pathType: ${relPath} -> ${pathType}`);
    res.json({path: relPath, pathType});
});

router.get("/src/pathType/*", async function (req, res) {
    const relPath = decodeURI(req.originalUrl.substr("/api/src/pathType".length + 1));
    const pathType = await getPathType(relPath, cliOptions.srcpath);
    console.log(`pathType: ${relPath} -> ${pathType}`);
    res.json({path: relPath, pathType});
});

router.get("/cosine", (req, res) => {
    const doc1 = req.query.doc1;
    const doc2 = req.query.doc2;

    const cos = cosine(doc1, doc2);
    res.json({result: cos})
})

router.get("/cosineValues", (req, res) => {
    const doc1 = req.query.doc1;
    similarDocs(doc1, .3).then(docs => {
        res.json(docs)
    })
})

router.get("/onepager/:name", (req, res) => {
    const name = decodeURI(req.originalUrl.substr("/api/onepager".length + 1));
    const onepager = getOnepager(name);
    res.json(onepager)
})

router.get("/wordCounts", (req, res) => {
    const wordCounts = getWordCounts();
    res.json(wordCounts)
})

const init = () => {
    subscribeNewTermInfo();
    const initTermInfosPromise = initTermInfos();
    const initVectorsPromise = initVectors(cliOptions.vectorspath);
    const initOnepagersPromise = initOnepagers(cliOptions.onepagerspath);
    const initWordCountsPromise = initWordCounts(cliOptions.topicspath, cliOptions.num_topics, cliOptions.num_entries);
    return Promise.all([initTermInfosPromise, initVectorsPromise, initOnepagersPromise, initWordCountsPromise])
}

app.use('/api', router);

const port = cliOptions.port ? Number(cliOptions.port) : 3100;

init().then(() => {
    server.listen(port, function () {
        console.log(`server for nlp-client is listening on port ${port}, folder: ${rootFolder}`)
    });
})
