export const jsonStringifyWithSingleQuotes = (obj: any) => {
    return JSON.stringify(obj).replace(/"/g, "\'");
}

export const joinUrlPaths = (path1: string, path2: string): string => {
    if(path1.endsWith("/") || path2.startsWith("/")) {
        return `${path1}${path2}`
    } else {
        return `${path1}/${path2}`
    }
}

export const randomNumberBetween = (from, toIncluding) => {
    return (from + (Math.floor(Math.random() * (toIncluding - from + 1))))
}
