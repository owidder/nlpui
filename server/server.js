const express = require("express");
const bodyParser = require('body-parser');
const commandLineArgs = require('command-line-args');
const path = require("path");

const {cosine, similarDocs, initVectorspath, similarDocsFromFileWithProgress} = require("./vectors");
const {readFeatures, TFIDF_EXTENSION, TFIDF_FOLDER} = require("./tfidf");
const {writeJsonz} = require("./stream");

const {
    readAggFolder, readSrcFolder2, readSubAggFolders, initStopwords,
    saveStopwords, filterStopwordsAndUnstem, stopwords, initNumberOfFiles, getNumberOfFiles,
    readAllValuesForOneFeature, typeFromPath
} = require("./serverFunctions");
const {initUnstemDict, unstem, stemFromUnstem} = require("./unstem");

const cliOptionsConfig = [
    {name: "datapath", alias: "d", type: String},
    {name: "port", type: String},
    {name: "stopwordspath", alias: "p", type: String},
    {name: "reverseunstem", alias: "r", type: String}
]

const cliOptions = commandLineArgs(cliOptionsConfig);

const app = express();
const router = express.Router();
app.use(bodyParser.json());
const rootFolder = __dirname + "/../build";
app.use("/", express.static(rootFolder));

const server = require("http").createServer(app);

router.get("/agg/folder/*", async function (req, res) {
    try {
        const relFolder = req.originalUrl.substr("/api/agg/folder".length + 1);
        const folder = path.join(cliOptions.datapath, TFIDF_FOLDER, relFolder);
        const wordsAndValues = await readAggFolder(folder);
        res.json(filterStopwordsAndUnstem(relFolder, wordsAndValues));
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
});

let totalSubAgg;

router.get("/subAgg/folder/*", async function (req, res) {
    const relFolder = req.originalUrl.substr("/api/subAgg/folder".length + 1);

    try {
        let subAggToReturn;

        if(relFolder.length == 0) {
            subAggToReturn = totalSubAgg;
        } else {
            subAggToReturn = await readSubAggFolders(relFolder, cliOptions.datapath, () => {});
        }

        await writeJsonz(null, JSON.stringify(subAggToReturn), res);
        res.status(200).send();
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
});

router.get("/numberOfFiles", async function (req, res) {
    try {
        res.json({numberOfFiles: getNumberOfFiles()});
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
});

router.get("/src/folder2/*", async function (req, res) {
    try {
        const relFolder = req.originalUrl.substr("/api/src/folder2".length + 1);
        const absFolder = path.join(cliOptions.datapath, TFIDF_FOLDER, relFolder);
        const entries = await readSrcFolder2(absFolder);
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
        const absPath = path.join(cliOptions.datapath, TFIDF_FOLDER, relPath);
        const pathType = await typeFromPath(absPath);
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
    if(req.header("x-nginx-proxy") == "true") {
        res.set({
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        });
    }

    try {
        const doc1 = req.query.doc1;
        console.log(`cosineValuesWithProgress: ${doc1} / ${JSON.stringify(req.headers, null, 4)}`);
        await similarDocsFromFileWithProgress(doc1, .1, res, 100, "Employee", path.join(cliOptions.datapath, TFIDF_FOLDER));
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
})

router.get("/features", async (req, res) => {
    try {
        const doc1 = req.query.doc1;
        const features = await readFeatures(path.join(cliOptions.datapath, TFIDF_FOLDER, `${doc1}.${TFIDF_EXTENSION}`));
        const unstemmedFeatures = features.map(f => {
            return {...f, feature: unstem(f.feature)}
        })
        unstemmedFeatures.sort((f1, f2) => f2.value - f1.value)
        res.json(unstemmedFeatures)
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
})

router.get("/valuesForFeature", async (req, res) => {
    try {
        const relFolder = req.query.path;
        const feature = req.query.feature;
        const absPath = path.join(cliOptions.datapath, TFIDF_FOLDER, relFolder)
        const values = await readAllValuesForOneFeature(absPath, feature);
        await writeJsonz(null, JSON.stringify(values), res);
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
})

router.post("/setStopword", async (req, res) => {
    try {
        if (cliOptions.stopwordspath != null) {
            const {path, word} = req.body;
            const stemmed = stemFromUnstem(word);
            if (stopwords[path] == undefined) {
                stopwords[path] = [stemmed]
            } else {
                if (!stopwords[path].includes(stemmed)) {
                    stopwords[path].push(stemmed)
                }
            }
            saveStopwords(cliOptions.stopwordspath);
            res.json({status: "ok"})
        } else {
            res.status(409).json({error: "stopwords editing not enabled"});
        }
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
})

app.use('/api', router);

const port = cliOptions.port ? Number(cliOptions.port) : 3100;

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err);
});

initVectorspath(path.join(cliOptions.datapath, "vectors.csv")).then(async () => {
    initStopwords(cliOptions.stopwordspath);
    initUnstemDict(cliOptions.datapath, cliOptions.reverseunstem);
    await initNumberOfFiles(path.join(cliOptions.datapath, TFIDF_FOLDER));
    totalSubAgg = await readSubAggFolders("", cliOptions.datapath, (progress) => {
        console.log(progress);
    });
    server.listen(port, function () {
        console.log(`server for nlpui is listening on port ${port}, folder: ${rootFolder}`)
    });
})
