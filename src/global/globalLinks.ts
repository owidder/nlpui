export interface LinkConfig {
    currentMetric?: string
    feature?: string
    path?: string
    r?: number
}

let currentLinkConfig: LinkConfig = {r: 0}

const nextR = () => currentLinkConfig.r < 9 ? currentLinkConfig.r + 1 : 0;

export const configureGlobalLinks = (newLink: LinkConfig) => {
    configureTreemapHomeLink(newLink);
    configureCosineBrowserHomeLink(newLink);
}

const configureTreemapHomeLink = (newLinkConfig: LinkConfig) => {
    currentLinkConfig = {...currentLinkConfig, ...newLinkConfig, r: nextR()}

    document.querySelector(".homelink a")
        .setAttribute("href",
            `/treemap/treemap.html?r=${currentLinkConfig.r}#feature=${currentLinkConfig.feature}&currentMetric=${currentLinkConfig.currentMetric}`);
}

const configureCosineBrowserHomeLink = (newLinkConfig: LinkConfig) => {
    currentLinkConfig = {...currentLinkConfig, ...newLinkConfig, r: nextR()}

    document.querySelector(".switchlink a")
        .setAttribute("href",
            `/cosine-browser/cosine-browser.html?r=${currentLinkConfig.r}#feature=${currentLinkConfig.feature}&currentMetric=${currentLinkConfig.currentMetric}`);
}
