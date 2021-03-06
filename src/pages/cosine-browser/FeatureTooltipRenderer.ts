import {Feature, sortFeatures} from "../Feature";
import {doListEffect} from "../../util/tooltip";
import {addEventListener, removeAllEventListeners} from "../../util/listener";

type IsHighlightedCallback = (stem: string) => boolean
type ListFootCallback = (documentPath: string) => string
type HrefCallback = (feature: string, fullWord?: string) => string

const SHORTLIST_LENGTH = 20;

export class FeatureTooltipRenderer {
    href: HrefCallback
    isHighlighted: IsHighlightedCallback
    listFoot: ListFootCallback

    shortlist = true;

    constructor(href: HrefCallback,
                isHighlighted: IsHighlightedCallback = () => false,
                listFoot:ListFootCallback = () => "<span/>") {
        this.href = href;
        this.isHighlighted = isHighlighted;
        this.listFoot = listFoot;
    }

    render(documentPath: string, features: Feature[]) {
        if (!features) return;

        const sortedFeatures = sortFeatures(features);

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

        const showall = `<a class="fakelink tooltip-link" onclick="document.dispatchEvent(new CustomEvent('showall'))">show all ${sortedFeatures.length}</a><br/>`;
        const showless = `<a class="fakelink tooltip-link" onclick="document.dispatchEvent(new CustomEvent('showless'))">show only first ${SHORTLIST_LENGTH}</a><br/>`;

        const list = sortedFeatures.slice(0, this.shortlist ? SHORTLIST_LENGTH : sortedFeatures.length).map(f => {
            const searchLink = `<a href="${this.href(f.stem)}" onclick="document.dispatchEvent(new CustomEvent('reload'))">${f.stem}</a>`
            const words = f.features.map(feature => `<a href="${this.href(f.stem, feature)}" onclick="document.dispatchEvent(new CustomEvent('reload'))">${feature}</a>`).join(", ");
            return `<span class="${this.isHighlighted(f.stem) ? 'highlight-feature' : 'lowlight-feature'}">${searchLink} [${words}] <small>[${f.value.toFixed(2)}]</small></span>`
        });

        const listHead = `<span class="tooltip-title">${documentPath}</span>`
            + "<br>"
            + (this.shortlist ? ((sortedFeatures.length <= SHORTLIST_LENGTH) ? "<span/>" : showall) : ((sortedFeatures.length <= SHORTLIST_LENGTH) ? "<span/>" : showless));

        doListEffect(listHead, this.listFoot(documentPath), list);
    }
}
