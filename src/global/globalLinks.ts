import {getHashString, HashValues} from "../util/queryUtil2";

let currentLinkConfig: HashValues = {}

export const configureGlobalLinksForTreemapPage = (newLinkConfig: HashValues) => {
    configureTreemapHomeLink(newLinkConfig);
    configureSwitchToCosineBrowserLink(newLinkConfig);
}

export const configureGlobalLinksForCosineBrowserPage = (newLinkConfig: HashValues) => {
    configureCosineBrowserHomeLink(newLinkConfig);
    configureSwitchToTreemapLink(newLinkConfig);
}

export const configureTreemapHomeLink = (newLinkConfig: HashValues) => {
    configureGlobalHomeLink("treemap", newLinkConfig);
}

export const configureCosineBrowserHomeLink = (newLinkConfig: HashValues) => {
    configureGlobalHomeLink("cosine-browser", newLinkConfig);
}

export const configureSwitchToTreemapLink = (newLinkConfig: HashValues) => {
    configureGlobalSwitchLink("treemap", newLinkConfig);
}

export const configureSwitchToCosineBrowserLink = (newLinkConfig: HashValues) => {
    configureGlobalSwitchLink("cosine-browser", newLinkConfig);
}

const configureGlobalSwitchLink = (pageNameToSwitchTo, newLinkConfig: HashValues) => {
    currentLinkConfig = {...currentLinkConfig, ...newLinkConfig}

    document.querySelector(".switchlink a")
        .setAttribute("href",
            `/${pageNameToSwitchTo}/${pageNameToSwitchTo}.html#${getHashString(currentLinkConfig)}`);
}

const configureGlobalHomeLink = (pageName: string, newLinkConfig: HashValues) => {
    currentLinkConfig = {...currentLinkConfig, ...newLinkConfig}

    document.querySelector(".homelink a")
        .setAttribute("href",
            `/${pageName}/${pageName}.html#${getHashString({...currentLinkConfig, path: "."})}`);
}
