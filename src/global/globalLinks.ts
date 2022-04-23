interface LinkConfig {
    currentMetric?: string
    feature?: string
    path?: string
    r?: number
}

let currentLinkConfig: LinkConfig = {r: 0}

const nextR = () => currentLinkConfig.r < 9 ? currentLinkConfig.r + 1 : 0;

export const configureGlobalLinksForTreemapPage = (newLinkConfig: LinkConfig) => {
    configureTreemapHomeLink(newLinkConfig);
    configureSwitchToCosineBrowserLink(newLinkConfig);
}

export const configureGlobalLinksForCosineBrowserPage = (newLinkConfig: LinkConfig) => {
    configureCosineBrowserHomeLink(newLinkConfig);
    configureSwitchToTreemapLink(newLinkConfig);
}

export const configureTreemapHomeLink = (newLinkConfig: LinkConfig) => {
    configureGlobalHomeLink("treemap", newLinkConfig);
}

export const configureCosineBrowserHomeLink = (newLinkConfig: LinkConfig) => {
    configureGlobalHomeLink("cosine-browser", newLinkConfig);
}

export const configureSwitchToTreemapLink = (newLinkConfig: LinkConfig) => {
    configureGlobalSwitchLink("treemap", newLinkConfig, "zoomto");
}

export const configureSwitchToCosineBrowserLink = (newLinkConfig: LinkConfig) => {
    configureGlobalSwitchLink("cosine-browser", newLinkConfig, "path");
}

const configureGlobalSwitchLink = (pageNameToSwitchTo, newLinkConfig: LinkConfig, pathAttributeName: string) => {
    currentLinkConfig = {...currentLinkConfig, ...newLinkConfig, r: nextR()}

    document.querySelector(".switchlink a")
        .setAttribute("href",
            `/${pageNameToSwitchTo}/${pageNameToSwitchTo}.html?r=${currentLinkConfig.r}#feature=${currentLinkConfig.feature}&currentMetric=${currentLinkConfig.currentMetric}&${pathAttributeName}=${currentLinkConfig.path}`);
}

const configureGlobalHomeLink = (pageName: string, newLinkConfig: LinkConfig) => {
    currentLinkConfig = {...currentLinkConfig, ...newLinkConfig, r: nextR()}

    document.querySelector(".homelink a")
        .setAttribute("href",
            `/${pageName}/${pageName}.html?r=${currentLinkConfig.r}#feature=${currentLinkConfig.feature}&currentMetric=${currentLinkConfig.currentMetric}`);
}