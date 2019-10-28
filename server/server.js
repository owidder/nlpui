const path = require("path");
const express = require('express');

const app = express();
const router = express.Router();

const server = require("http").createServer(app);

const SUMMARY_FILENAME = '_.csv';
const BASE_FOLDER = "/Users/oliver/dev/github/nlp/out";
const VALUE_FILE_SUFFIX = ".tfidf.csv";

function isSummaryFile(filename) {
    return filename == SUMMARY_FILENAME;
}

function isValueFile(filename) {
    return isSummaryFile(filename) || filename.endsWith(VALUE_FILE_SUFFIX);
}

function isDirectory(filename, absFolder) {
    return fs.lstatSync(path.join(absFolder, filename)).isDirectory();
}

function sortNonCaseSensitive(list) {
    return list.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
}

function readFolder(relFolder) {
    const absFolder = path.join(BASE_FOLDER, relFolder);
    const filesAndSubfolders = fs.readdirSync(absFolder);
    const onlyFoldersAndValueFiles = filterNonValueFiles(filesAndSubfolders, absFolder);
    return sortNonCaseSensitive(adaptNames(onlyFoldersAndValueFiles, absFolder));
}

function filterNonValueFiles(filesAndSubfolderNameList, absFolder) {
    return filesAndSubfolderNameList.filter(fileOrSubfolderName => {
        return isValueFile(fileOrSubfolderName) || isDirectory(fileOrSubfolderName, absFolder);
    });
}

router.get('/folder/*', function (req, res) {
    var relFolder = req.originalUrl.substr("/api/folder".length+1);
    res.json({
        folder: relFolder,
        content: readFolder(relFolder)
    });
});

app.use('/api', router);

server.listen(3100, function () {
    console.log("server for nlp-client is listening on port 3100")
});
