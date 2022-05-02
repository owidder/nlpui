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
    configureGlobalSwitchLink("Switch to map", "treemap", newLinkConfig);
}

export const configureSwitchToCosineBrowserLink = (newLinkConfig: HashValues) => {
    configureGlobalSwitchLink("Switch to list/cloud", "cosine-browser", newLinkConfig);
}

const configureGlobalSwitchLink = (showAsText: string, pageNameToSwitchTo, newLinkConfig: HashValues) => {
    currentLinkConfig = {...currentLinkConfig, ...newLinkConfig}

    const switchLink = document.querySelector(".switchlink a");

    switchLink.setAttribute("href", `/${pageNameToSwitchTo}/${pageNameToSwitchTo}.html#${getHashString(currentLinkConfig)}`);
    switchLink.innerHTML = showAsText;
}

const configureGlobalHomeLink = (pageName: string, newLinkConfig: HashValues) => {
    currentLinkConfig = {...currentLinkConfig, ...newLinkConfig}

    document.querySelector(".homelink a")
        .setAttribute("href",
            `/${pageName}/${pageName}.html#${getHashString({...currentLinkConfig, path: "."})}`);
}
