const path = require("path");
const fs = require("fs");
const express = require("express");
const bodyParser = require('body-parser');
const commandLineArgs = require('command-line-args');

const {initVectors, cosine, similarDocs} = require("./vectors");

const cliOptionsConfig = [
    {name: "srcpath", alias: "s", type: String},
    {name: "vectorspath", alias: "v", type: String},
    {name: "port", type: String},
]

const cliOptions = commandLineArgs(cliOptionsConfig);

const app = express();
const router = express.Router();
app.use(bodyParser.json());
const rootFolder = __dirname + "/../build";
app.use("/", express.static(rootFolder));

const server = require("http").createServer(app);

function sortNonCaseSensitive(list) {
    return list.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
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

function pathTypeFromStats(stats) {
    return stats.isDirectory() ? "folder" : "file";
}

function getPathType(relPath, basePath = cliOptions.srcpath) {
    const absPath = path.join(basePath, relPath);
    return new Promise((resolve, reject) => {
        fs.stat(absPath, (err, stats) => {
            if (err) reject(err);
            resolve(pathTypeFromStats(stats))
        })
    })
}

router.get("/src/folder/*", async function (req, res) {
    const relFolder = req.originalUrl.substr("/api/src/folder".length + 1);
    const content = await readSrcFolder(relFolder, cliOptions.srcpath)
    res.json({folder: relFolder, content});
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

app.use('/api', router);

const port = cliOptions.port ? Number(cliOptions.port) : 3100;

initVectors(cliOptions.vectorspath).then(() => {
    server.listen(port, function () {
        console.log(`server for nlpui is listening on port ${port}, folder: ${rootFolder}`)
    });
})
