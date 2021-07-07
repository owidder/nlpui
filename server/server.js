const express = require("express");
const bodyParser = require('body-parser');
const commandLineArgs = require('command-line-args');

const {initVectors, cosine, similarDocs} = require("./vectors");

const {readSrcFolder, getPathType} = require("./serverFunctions")

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

router.get("/src/folder/*", async function (req, res) {
    try {
        const relFolder = req.originalUrl.substr("/api/src/folder".length + 1);
        const content = await readSrcFolder(relFolder, cliOptions.srcpath)
        res.json({folder: relFolder, content});
    } catch (e) {
        res.status(500).json({ error: e.toString() });
    }
});

router.get("/src/pathType/*", async function (req, res) {
    try {
        const relPath = decodeURI(req.originalUrl.substr("/api/src/pathType".length + 1));
        const pathType = await getPathType(relPath, cliOptions.srcpath);
        console.log(`pathType: ${relPath} -> ${pathType}`);
        res.json({path: relPath, pathType});
    } catch (e) {
        res.status(500).json({ error: e.toString() });
    }
});

router.get("/cosine", (req, res) => {
    try {
        const doc1 = req.query.doc1;
        const doc2 = req.query.doc2;

        const cos = cosine(doc1, doc2);
        res.json({result: cos})
    } catch (e) {
        res.status(500).json({ error: e.toString() });
    }
})

router.get("/cosineValues", async (req, res) => {
    try {
        const doc1 = req.query.doc1;
        const docs = await similarDocs(doc1, .5)
        res.json(docs.slice(0, 10))
    } catch (e) {
        res.status(500).json({ error: e.toString() });
    }
})

app.use('/api', router);

const port = cliOptions.port ? Number(cliOptions.port) : 3100;

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err);
});

initVectors(cliOptions.vectorspath).then(() => {
    server.listen(port, function () {
        console.log(`server for nlpui is listening on port ${port}, folder: ${rootFolder}`)
    });
})
