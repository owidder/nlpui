const docNameFromPath = (path: string): string => {
    return path.split("/").reverse()[0].split(".utf8")[0]
}

export {docNameFromPath}
