export const jsonStringifyWithSingleQuotes = (obj: any) => {
    return JSON.stringify(obj).replace(/"/g, "\'");
}
