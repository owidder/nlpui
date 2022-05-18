import {Feature, smallestFeatureValue, sortFeatures} from "../Feature";
import {doListEffect} from "../../util/tooltip";
import {addEventListener, removeAllEventListeners} from "../../util/listener";

type IsHighlightedCallback = (feature: string) => boolean
type ListFootCallback = (documentPath: string) => string

export class FeatureTooltipRenderer {
    href: (feature: string) => string
    isHighlighted: IsHighlightedCallback
    listFoot: ListFootCallback

    shortlist = true;

    constructor(href: (feature: string) => string,
                isHighlighted: IsHighlightedCallback = () => false,
                listFoot:ListFootCallback = () => "<span/>") {
        this.href = href;
        this.isHighlighted = isHighlighted;
        this.listFoot = listFoot;
    }

    render(documentPath: string, features: Feature[]) {
        if (!features) return;

        const sortedFeatures = sortFeatures(features);
        const smallestValue = smallestFeatureValue(features);

        removeAllEventListeners("showall");
        addEventListener("showall", () => {
            console.log("showall")
            this.shortlist = false;
            this.render(documentPath, sortedFeatures);
        });

        removeAllEventListeners("showless");
        addEventListener("showless", () => {
            console.log("showless")
            this.shortlist = true;
            this.render(documentPath, sortedFeatures);
        });

        const showall = `<a class="fakelink tooltip-link" onclick="document.dispatchEvent(new CustomEvent('showall'))">show all...</a><br/>`;
        const showless = `<a class="fakelink tooltip-link" onclick="document.dispatchEvent(new CustomEvent('showless'))">show less...</a><br/>`;

        const list = sortedFeatures.filter(f => this.shortlist ? f.value > 0.1 : f).map(f => {
            return `<span class="${this.isHighlighted(f.feature) ? 'highlight-feature' : 'lowlight-feature'}"><a href="${this.href(f.feature)}" onclick="document.dispatchEvent(new CustomEvent('reload'))">${f.feature} <small>[${f.value.toFixed(2)}]</small></a></span>`
        });

        const listHead = `<span class="tooltip-title">${documentPath}</span>`
            + "<br>"
            + (this.shortlist ? ((smallestValue > 0.1) ? "<span/>" : showall) : ((smallestValue > 0.1) ? "<span/>" : showless));

        doListEffect(listHead, this.listFoot(documentPath), list);
    }
}
