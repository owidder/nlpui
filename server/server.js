const express = require("express");
const bodyParser = require('body-parser');
const commandLineArgs = require('command-line-args');
const path = require("path");
const fs = require("fs");

const {cosine, similarDocs, initVectorspath, similarDocsFromFileWithProgress} = require("./vectors");
const {readFeatures} = require("./tfidf");

const {readAggFolder, readSrcFolder2, TFIDF_EXTENSION, getPathType} = require("./serverFunctions")

const cliOptionsConfig = [
    {name: "datapath", alias: "d", type: String},
    {name: "port", type: String},
    {name: "stopwordspath", alias: "p", type: String},
]

const cliOptions = commandLineArgs(cliOptionsConfig);

const app = express();
const router = express.Router();
app.use(bodyParser.json());
const rootFolder = __dirname + "/../build";
app.use("/", express.static(rootFolder));

const server = require("http").createServer(app);

const saveStopwords = () => {
    const stopwordsStr = JSON.stringify(stopwords, null, 4);
    fs.writeFileSync(cliOptions.stopwordspath, stopwordsStr);
}

const readStopwords = () => {
    if(fs.existsSync(cliOptions.stopwordspath)) {
        const stopwordsStr = fs.readFileSync(cliOptions.stopwordspath);
        return JSON.parse(stopwordsStr);
    }

    return {}
}

let stopwords;
let unstemDict;
let reversedUnstemDict;

const readUnstemDict = () => {
    const unstemDictPath = path.join(cliOptions.datapath, "unstem_dict.json");
    if(fs.existsSync(unstemDictPath)) {
        const unstemDictJson = fs.readFileSync(unstemDictPath);
        return JSON.parse(unstemDictJson);
    }

    return {}
}

const createReversedDict = (dict) => {
    return Object.keys(dict).reduce((_rev, word) => {
        return {..._rev, [dict[word]]: word}
    }, {})
}

const unstem = (word) => unstemDict[word] ? unstemDict[word] : word;

const filterStopwords = (path, wordsAndValues) => {
    let filteredWordsAndValues = [...wordsAndValues]
    for(const _path in stopwords) {
        filteredWordsAndValues = filteredWordsAndValues.filter(wav => {
            if(_path == "." || path.startsWith(_path)) {
                return !stopwords[_path].includes(wav.word)
            }

            return true
        })
    }

    return filteredWordsAndValues
}

router.get("/agg/folder/*", async function (req, res) {
   try {
       const relFolder = req.originalUrl.substr("/api/agg/folder".length + 1);
       const wordsAndValues = await readAggFolder(`tfidf/${relFolder}`, cliOptions.datapath);
       const filteredWordsAndValues = filterStopwords(relFolder, wordsAndValues);
       const unstemmed = filteredWordsAndValues.map(wav => {
           return {...wav, word: unstem(wav.word)}
       })
       res.json(unstemmed);
   } catch(e) {
       res.status(500).json({error: e.toString()});
   }
});

router.get("/src/folder2/*", async function (req, res) {
    try {
        const relFolder = req.originalUrl.substr("/api/src/folder2".length + 1);
        const entries = await readSrcFolder2(relFolder, path.join(cliOptions.datapath, "tfidf"));
        const undottedEntries = entries.filter(e => !e.startsWith("."));
        const foldersOrFilesWithVectors = cliOptions.filter == true ? await filterFilesWithoutVectors(relFolder, undottedEntries) : undottedEntries;
        res.json({
            folder: relFolder, content: foldersOrFilesWithVectors
        });
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
});

router.get("/src/pathType/*", async function (req, res) {
    try {
        const relPath = decodeURI(req.originalUrl.substr("/api/src/pathType".length + 1));
        const pathType = await getPathType(relPath, path.join(cliOptions.datapath, "tfidf"));
        console.log(`pathType: ${relPath} -> ${pathType}`);
        res.json({path: relPath, pathType});
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
});

router.get("/cosine", (req, res) => {
    try {
        const doc1 = req.query.doc1;
        const doc2 = req.query.doc2;

        const cos = cosine(doc1, doc2);
        res.json({result: cos})
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
})

router.get("/config", (req, res) => {
    res.json({editStopwords: cliOptions.stopwordspath != null})
})

const _streamRecursive = (res, max, ctr) => {
    if(ctr < max) {
        setTimeout(() => {
            res.write(`ctr:${ctr}/${max}`);
            _streamRecursive(res, max, ctr+1);
            console.log(`ctr = ${ctr}`);
        }, 1000)
    } else {
        setTimeout(() => {
            res.write(`json:${JSON.stringify({time: Date.now()})}`)
            res.status(200).send()
        })
    }
}

router.get("/stream", (req, res) => {
    const max = req.query.max;
    _streamRecursive(res, max, 0)
})

router.get("/cosineValues", async (req, res) => {
    try {
        const doc1 = req.query.doc1;
        const docs = await similarDocs(doc1, .1)
        res.json(docs.slice(0, 100))
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
})

router.get("/cosineValuesWithProgress", async (req, res) => {
    try {
        const doc1 = req.query.doc1;
        const docs = await similarDocsFromFileWithProgress(doc1, .1, (progress) => {
            res.write(`progress:${progress}`)
        })
        res.write(`json:${JSON.stringify(docs.slice(0, 100))}`);
        res.status(200).send();
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
})

router.get("/features", async (req, res) => {
    try {
        const doc1 = req.query.doc1;
        const features = await readFeatures(path.join(cliOptions.datapath, `tfidf/${doc1}.${TFIDF_EXTENSION}`));
        const unstemmedFeatures = features.map(f => {
            return {...f, feature: unstem(f.feature)}
        })
        res.json(unstemmedFeatures)
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
})

router.post("/setStopword", async (req, res) => {
    try {
        if(cliOptions.stopwordspath != null) {
            const {path, word} = req.body;
            const stemmed = reversedUnstemDict[word] ? reversedUnstemDict[word] : word;
            if(stopwords[path] == undefined) {
                stopwords[path] = [stemmed]
            } else {
                if(!stopwords[path].includes(stemmed)) {
                    stopwords[path].push(stemmed)
                }
            }
            saveStopwords();
            res.json({status: "ok"})
        } else {
            res.status(409).json({error: "stopwords editing not enabled"});
        }
    } catch(e) {
        res.status(500).json({error: e.toString()});
    }
})

app.use('/api', router);

const port = cliOptions.port ? Number(cliOptions.port) : 3100;

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err);
});

initVectorspath(path.join(cliOptions.datapath, "vectors.csv")).then(() => {
    stopwords = readStopwords();
    unstemDict = readUnstemDict();
    reversedUnstemDict = createReversedDict(unstemDict);
    server.listen(port, function () {
        console.log(`server for nlpui is listening on port ${port}, folder: ${rootFolder}`)
    });
})
