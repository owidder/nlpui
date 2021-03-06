import {joinUrlPaths} from "../util/miscUtil";

export const srcPathFromPath = (path: string, srcPathMap: {[name: string]: string}): string => {
    const pathPrefixes = Object.keys(srcPathMap as any | {});

    if(pathPrefixes.length < 1) return "";

    for(let p = 0; p < pathPrefixes.length; p++) {
        const pathPrefix = pathPrefixes[p];
        if(path.startsWith(pathPrefix) && srcPathMap[pathPrefix].length > 0) {
            return joinUrlPaths(srcPathMap[pathPrefix], path.substring(pathPrefix.length))
        }
    }

    return ""
}
