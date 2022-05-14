const _path = require("path");

export const srcPathFromPath = (path: string, srcPathMap: {[name: string]: string}): string => {
    console.log(`path = ${path}`)
    const pathPrefixes = Object.keys(srcPathMap as any | {});

    if(pathPrefixes.length < 1) return "";

    for(let p = 0; p < pathPrefixes.length; p++) {
        const pathPrefix = pathPrefixes[p];
        if(path.startsWith(pathPrefix) && srcPathMap[pathPrefix].length > 0) {
            console.log(`srcPathMapEntry = ${srcPathMap[pathPrefix]}`);
            console.log(`substring = path.substring(pathPrefix.length)`);
            const srcPath = _path.join(srcPathMap[pathPrefix], path.substring(pathPrefix.length));
            console.log(`srcPath = ${srcPath}`);
            return srcPath
        }
    }

    return ""
}
