const queryString = require('query-string');

export type HashValues = {[name: string]: string | number};

const getHashParamMap = () => {
    const hash = window.location.hash;
    return queryString.parse(hash);
}

export const getSearchParamValue = (paramName: string) => {
    const search = window.location.search;
    const parsed = queryString.parse(search);

    return parsed[paramName];
}

export const getHashParamValue = (paramName: string, defValue?: string) => {
    const hash = window.location.hash;
    const parsed = queryString.parse(hash);

    return parsed[paramName] || defValue;
}

const doCutTrailingSlash = (value: string, cutTrailingSlash: boolean) => {
    if(cutTrailingSlash && value && value.length > 0 && value.endsWith("/")) {
        return value.substr(0, value.length-1);
    }

    return value;
}

export const getParamValue = (paramName: string, cutTrailingSlash = false) => {
    const searchParamValue = getSearchParamValue(paramName);
    if(searchParamValue) {
        return doCutTrailingSlash(searchParamValue, cutTrailingSlash);
    }

    return doCutTrailingSlash(getHashParamValue(paramName), cutTrailingSlash);
}

export const getParamValueWithDefault = (paramName: string, defaultValue: string) => {
    const param = getParamValue(paramName);
    return param ? param : defaultValue;
}

export const setHashValue = (name: string, value: string | number) => {
    const hashParamMap = getHashParamMap();
    const newHashParamMap = {...hashParamMap, [name]: value};
    window.location.hash = queryString.stringify(newHashParamMap);
}

export const setHashValues = (hashValues: HashValues) => {
    for(const name in hashValues) {
        setHashValue(name, hashValues[name])
    }
}

export const getHashString = (hashValues: HashValues): string => {
    return queryString.stringify(hashValues);
}

export const getCurrentHashString = (): string => {
    return getHashString(getHashParamMap());
}

export const getCurrentHashStringWithNewValues = (newHashValues: HashValues): string => {
    const currentHashString = getHashParamMap();
    return getHashString({...currentHashString, ...newHashValues})
}

export const currentLocationWithNewHashValues = (newHashValues: HashValues) => {
    return `${window.location.origin}${window.location.pathname}${window.location.search}#${getCurrentHashStringWithNewValues(newHashValues)}`
}

export const removeHashName = (name: string) => {
    const hashParamMap = getHashParamMap();
    delete hashParamMap[name];
    window.location.hash = queryString.stringify(hashParamMap);
}
