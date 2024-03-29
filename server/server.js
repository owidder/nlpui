const express = require("express");
const bodyParser = require('body-parser');
const commandLineArgs = require('command-line-args');
const path = require("path");

const {initVectorspath, similarDocsFromFileWithProgress, VECTORS_FILE_NAME} = require("./vectors");
const {readFeatures, TFIDF_EXTENSION, TFIDF_FOLDER} = require("./tfidf");
const {writeJsonz} = require("./stream");
const {getSrcPathMap} = require("./srcPath");
const {createStemIndex, searchStem, searchStemInPath, searchStemAndFullWordInPath, searchStemAndFullWord} = require("./searchEngine");

const {readAggFolder, readSrcFolder2, readSubAggFolders, readAllValuesForOneFeature, readSrcFolder3} = require("./serverFunctions");
const {typeFromPathWithDefaultExtension} = require("./fileUtil");
const {initUnstemDict, unstem, unstemWordsAndValues} = require("./unstem");

const cliOptionsConfig = [
    {name: "datapath", alias: "d", type: String},
    {name: "port", type: String},
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
        console.time("/agg/folder");
        const relFolder = req.originalUrl.substr("/api/agg/folder".length + 1);
        const folder = path.join(cliOptions.datapath, TFIDF_FOLDER, relFolder);
        const wordsAndValues = await readAggFolder(folder);
        res.json(await unstemWordsAndValues(wordsAndValues, cliOptions.datapath, relFolder));
        console.timeEnd("/agg/folder");
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
});

let totalSubAgg;

router.get("/subAgg/folder/*", async function (req, res) {
    const relFolder = req.originalUrl.substring("/api/subAgg/folder".length + 1);
    console.log(`subAgg: ${relFolder}`);

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

router.get("/src/folder2/*", async function (req, res) {
    try {
        const relFolder = req.originalUrl.substr("/api/src/folder2".length + 1);
        const absFolder = path.join(cliOptions.datapath, TFIDF_FOLDER, relFolder);
        const entries = await readSrcFolder2(absFolder);
        const advancedEntries = await readSrcFolder3(path.join(cliOptions.datapath, TFIDF_FOLDER), relFolder)
        const undottedEntries = entries.filter(e => !e.startsWith("."));
        res.json({
            folder: relFolder, content: undottedEntries, advancedEntries
        });
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
});

router.get("/src/pathType/*", async function (req, res) {
    try {
        const relPath = decodeURI(req.originalUrl.substr("/api/src/pathType".length + 1));
        const absPath = path.join(cliOptions.datapath, TFIDF_FOLDER, relPath);
        const pathType = await typeFromPathWithDefaultExtension(absPath, TFIDF_EXTENSION);
        console.log(`pathType: ${relPath} -> ${pathType}`);
        res.json({path: relPath, pathType});
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
});

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
        const feature = req.query.feature;
        console.log(`cosineValuesWithProgress: ${doc1} / ${JSON.stringify(req.headers, null, 4)}`);
        await similarDocsFromFileWithProgress(doc1, .1, res, 100, feature, path.join(cliOptions.datapath, TFIDF_FOLDER));
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
})

router.get("/features", async (req, res) => {
    try {
        const doc1 = req.query.doc1;
        const features = await readFeatures(path.join(cliOptions.datapath, TFIDF_FOLDER, `${doc1}.${TFIDF_EXTENSION}`));
        const unstemmedFeatures = features.map(f => {
            return {...f, features: unstem(f.feature, cliOptions.datapath, `${doc1}._long_words_`), stem: f.feature}
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
        res.status(200).send();
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
})

router.get("/countsForFeature", async (req, res) => {
    try {
        const relFolder = req.query.path;
        const feature = req.query.feature;
        const absPath = path.join(cliOptions.datapath, TFIDF_FOLDER, relFolder)
        const values = await readAllValuesForOneFeature(absPath, feature);
        const counts = Object.keys(values).reduce((_counts, entry) => {
            return {..._counts, [entry]: values[entry].count}
        }, {});
        await writeJsonz(null, JSON.stringify(counts), res);
        res.status(200).send();
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
})

router.get("/srcPathMap", async (req, res) => {
    const srcPathMap = await getSrcPathMap(path.join(cliOptions.datapath, "info"));
    res.json(srcPathMap)
})

router.get("/searchStem", (req, res) => {
    const stem = req.query.stem;
    const path = req.query.path;
    if(path && path.length > 1) {
        res.json(searchStemInPath(stem, path))
    } else {
        res.json(searchStem(stem));
    }
})

router.get("/searchStemAndFullWord", async (req, res) => {
    const stem = req.query.stem;
    const fullWord = req.query.fullword;
    const path = req.query.path;
    if(path && path.length > 1) {
        res.json(searchStemAndFullWordInPath(stem, fullWord, path, cliOptions.datapath))
    } else {
        res.json(searchStemAndFullWord(stem, fullWord, cliOptions.datapath));
    }
})

app.use('/api', router);

const port = cliOptions.port ? Number(cliOptions.port) : 3100;

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err);
});

initVectorspath(path.join(cliOptions.datapath, VECTORS_FILE_NAME)).then(async () => {
    await createStemIndex("", ".tfidf.csv", path.join(cliOptions.datapath, "tfidf"));
    initUnstemDict(cliOptions.datapath);
    totalSubAgg = await readSubAggFolders("", cliOptions.datapath, (progress) => {
        console.log(progress);
    });
    server.listen(port, function () {
        console.log(`server for nlpui is listening on port ${port}, folder: ${rootFolder}`)
    });
})
