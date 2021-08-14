const path = require("path");
const fs = require("fs");
const commandLineArgs = require('command-line-args');

const {readSrcFolder, getPathType} = require("./serverFunctions")
const {initVectors, similarDocs} = require("./vectors");

const cliOptionsConfig = [
    {name: "srcpath", alias: "s", type: String},
    {name: "outpath", alias: "o", type: String},
    {name: "vectorspath", alias: "v", type: String},
    {name: "port", type: String},
    {name: "threshold", alias: "t", type: Number},
    {name: "type", alias: "y", type: String}
]

const cliOptions = commandLineArgs(cliOptionsConfig);

const createStaticFolderResponse = async (folderName, absPath, outPath) => {
    const filesAndFolders = await readSrcFolder(folderName, absPath)
    const outName = path.join(outPath, `${folderName}.json`)

    return new Promise((resolve, reject) => {
        const responseJson = {folder: folderName, content: filesAndFolders}
        fs.writeFile(outName, JSON.stringify(responseJson), err => {
            if(err) reject(err);
            resolve(responseJson)
        })
    })
}

const createStaticFileResponse = async (fileName, relPath, outPath) => {
    const similarDocsList = await similarDocs(path.join(relPath, fileName), .19)

    const outName = path.join(outPath, `${fileName}.json`)
    return new Promise((resolve, reject) => {
        fs.writeFile(outName, JSON.stringify(similarDocsList), err => {
            if(err) reject(err);
            resolve(similarDocsList)
        })
    })
}

const createStaticResponsesRecursive = async (absRootPath, currentRelPath, outPath, type) => {
    console.log(currentRelPath)
    const currentPath = path.join(absRootPath, currentRelPath)
    const filesAndFolders = await readSrcFolder("/", currentPath)
    for(const fileOrFolder of filesAndFolders) {
        if(!fileOrFolder.startsWith(".")) {
            const pathType = await getPathType(fileOrFolder, currentPath)
            if(pathType === "folder" && (type == null || pathType === type)) {
                const newOut = path.join(outPath, fileOrFolder)
                if(!fs.existsSync(newOut)) {
                    fs.mkdirSync(newOut)
                }
                await createStaticFolderResponse(fileOrFolder, currentPath, newOut)
                await createStaticResponsesRecursive(absRootPath, path.join(currentRelPath, fileOrFolder), newOut, type)
            } else if(pathType === "file" && (type == null || pathType === type)) {
                await createStaticFileResponse(fileOrFolder, currentRelPath, outPath)
            }
        }
    }
}

const main = async () => {
    await createStaticResponsesRecursive(cliOptions.srcpath, "", cliOptions.outpath, cliOptions.type)
    process.exit(0)
}

initVectors(cliOptions.vectorspath).then(() => {
    main()
    setInterval(() => console.log("Waiting"), 1000)
})
