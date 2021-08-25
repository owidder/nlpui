const express = require("express");
const bodyParser = require('body-parser');
const commandLineArgs = require('command-line-args');
const path = require("path");
const fs = require("fs");

const {initVectors, cosine, similarDocs, hasVector} = require("./vectors");
const {readFeatures} = require("./tfidf");

const {readSrcFolder, getPathType, readAggFolder} = require("./serverFunctions")

const cliOptionsConfig = [
    {name: "srcpath", alias: "s", type: String},
    {name: "datapath", alias: "d", type: String},
    {name: "port", type: String},
    {name: "filter", alias: "f", type: String},
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

const stopwords = readStopwords();

const filterFilesWithoutVectors = async (relFolder, entries) => {
    const filtered = [];
    for (const entry of entries) {
        const path = `${relFolder}/${entry}`;
        const pathType = await getPathType(path, cliOptions.srcpath);
        const isFolderOrFileWithVector = (pathType === "folder" || hasVector(path));
        if(isFolderOrFileWithVector) {
            filtered.push(entry);
        }
    }

    return filtered;
}

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
       res.json(filteredWordsAndValues);
   } catch(e) {
       res.status(500).json({error: e.toString()});
   }
});

router.get("/src/folder/*", async function (req, res) {
    try {
        const relFolder = req.originalUrl.substr("/api/src/folder".length + 1);
        const entries = await readSrcFolder(relFolder, cliOptions.srcpath);
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
        const pathType = await getPathType(relPath, cliOptions.srcpath);
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

router.get("/cosineValues", async (req, res) => {
    try {
        const doc1 = req.query.doc1;
        const docs = await similarDocs(doc1, .1)
        res.json(docs.slice(0, 100))
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
})

router.get("/features", async (req, res) => {
    try {
        const doc1 = req.query.doc1;
        const features = await readFeatures(path.join(cliOptions.datapath, `tfidf/${doc1}.tfidf.csv`));
        res.json(features)
    } catch (e) {
        res.status(500).json({error: e.toString()});
    }
})

router.post("/setStopword", async (req, res) => {
    try {
        const {path, word} = req.body;
        if(stopwords[path] == undefined) {
            stopwords[path] = [word]
        } else {
            if(!stopwords[path].includes(word)) {
                stopwords[path].push(word)
            }
        }
        saveStopwords();
        res.json({status: "ok"})
    } catch(e) {
        res.status(500).json({error: e.toString()});
    }
})

app.use('/api', router);

const port = cliOptions.port ? Number(cliOptions.port) : 3100;

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err);
});

initVectors(path.join(cliOptions.datapath, "vectors.csv")).then(() => {
    server.listen(port, function () {
        console.log(`server for nlpui is listening on port ${port}, folder: ${rootFolder}`)
    });
})
