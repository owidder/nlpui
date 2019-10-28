const fs = require('fs');

const foldersToBuild = (pagesFolderPath) => {
    const content = fs.readdirSync(pagesFolderPath);
    const foldersWithIndexHtml = content.filter(entry => {
        const pathToFolder = `${pagesFolderPath}/${entry}`;
        if(fs.lstatSync(pathToFolder).isDirectory()) {
            try {
                fs.accessSync(`${pathToFolder}/index.tsx`, fs.F_OK);
                return true;
            } catch (e) {
                return false;
            }
        }
    })

    return foldersWithIndexHtml;
}

module.exports = {foldersToBuild}