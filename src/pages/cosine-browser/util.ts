const docNameFromPath = (path: string): string => {
    return cutUtf8(path.split("/").reverse()[0])
}

const cutUtf8 = (name: string): string => name.split(".utf8")[0]

export {docNameFromPath, cutUtf8}
