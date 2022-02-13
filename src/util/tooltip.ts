import * as d3 from "d3";
import {Selection} from "d3-selection/index";

import {addEventListener, removeAllEventListeners} from "./listener";
import {jsonStringifyWithSingleQuotes} from "./miscUtil";

import "./tooltip.scss";

export type TooltipSelection = Selection<HTMLDivElement, any, HTMLElement, any>;
type TooltipCallback = (uid: string, d: any, tooltip: Tooltip, selectedExtraData?: string) => void;

export interface Tooltip {
    renderCallback: TooltipCallback;
    pinned: boolean;
    pinMessage: string;
    unpinMessage: string;
    inFocus?: boolean;
    selectedExtraData?: string
}

export interface Event {
    pageX: number;
    pageY: number;
    preventDefault: () => void
}

export const createTooltip = (renderCallback: TooltipCallback, _pinMessage?: string, _unpinMessage?: string,
                              initialSelectedExtraData?: string) => {
    console.log("create tooltip")
    selectAllTooltips().remove();
    d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    const pinMessage = _pinMessage === undefined ? "right click to pin" : _pinMessage;
    const unpinMessage = _unpinMessage === undefined ? "right click to unpin" : _unpinMessage;
    const tooltip: Tooltip = {pinned: false, renderCallback, pinMessage, unpinMessage, selectedExtraData: initialSelectedExtraData};

    selectAllTooltips()
        .on("mouseenter", () => {
            tooltip.inFocus = true;
            showTooltip();
            redrawTooltip();
        })
        .on("mouseleave", () => {
            tooltip.inFocus = false;
            redrawTooltip();
        })

    selectAllTooltips().data([tooltip]);
}

const _moveTooltip = (pageX: number, pageY: number) => {
    selectTooltip().style('transform', `translate(${pageX}px, ${pageY}px)`);
}

const isTooltipOn = () => d3.select("tooltip").style("opacity") == "1";

export const currentTooltip = (): Tooltip | void => {
    const data = selectAllTooltips().data();
    if(data && data.length > 0) {
        return data[0] as Tooltip;
    }
}

export const moveTooltip = (event: Event) => {
    const tooltip = currentTooltip();
    event.preventDefault();
    const {pageX, pageY} = event;
    if(tooltip && !tooltip.pinned) {
        _moveTooltip(pageX+15, pageY+15);
    }
}

export const showTooltip = () => {
    selectAllTooltips().style("opacity", 1);
}

export const hideTooltip = () => {
    selectAllTooltips().style("opacity", 0);
}

export const toggleTooltip = () => {
    if(isTooltipOn()) {
        hideTooltip();
    } else {
        showTooltip();
    }
}

const TOOLTIP_SELECTOR = ".tooltip";
const selectTooltip = () => d3.select(TOOLTIP_SELECTOR);
const selectAllTooltips = () => d3.selectAll(TOOLTIP_SELECTOR);

const tooltipUid = (uid?: string): string => {
    if(uid) {
        selectTooltip().property("uid", uid);
    }
    return selectTooltip().property("uid");
}

const tooltipData = (d?: any) => {
    if(d) {
        selectTooltip().property("data", d);
    }

    return selectTooltip().property("data");
}

export const setTooltipData = (uid: string, d: any) => {
    const tooltip = currentTooltip();
    if(tooltip && selectTooltip() && !tooltip.pinned && tooltipUid() != uid) {
        tooltipUid(uid);
        tooltipData(d);
        tooltip.renderCallback(uid, d, tooltip);
    }
}

export const redrawTooltip = () => {
    const tooltip = currentTooltip();
    const divTooltip = selectTooltip();
    if(tooltip && divTooltip) {
        tooltip.renderCallback(divTooltip.property("uid"), divTooltip.property("data"), tooltip);
    }
}

export const togglePinTooltip = () => {
    const tooltip = currentTooltip();
    if(tooltip) {
        tooltip.pinned = !tooltip.pinned;
        redrawTooltip();
    }
}

export const unpinTooltip = () => {
    const tooltip = currentTooltip();
    if(tooltip) {
        tooltip.pinned = false;
        redrawTooltip();
    }
}

export const doListEffect = async (head: string, foot: string, list: string[], listEnd?: string, extraData?: string[], createHash?: (selectedExtraData: string) => string) => {
    const tooltip = currentTooltip();
    if(tooltip) {
        const headtext = tooltip.inFocus ? undefined : `<span class="tooltip-headtext">${tooltip.pinned ? tooltip.unpinMessage : tooltip.pinMessage}</span>`;

        let subhead = "";
        if(extraData) {
            removeAllEventListeners("switchTooltipType");
            addEventListener("switchTooltipType", (e: {detail: {selectedExtraData: string}}) => {
                tooltip.selectedExtraData = e.detail.selectedExtraData;
                redrawTooltip();
            })
            subhead = extraData.reduce((_subhead, selectedExtraData) => {
                const dispatchEvent = `document.dispatchEvent(new CustomEvent('switchTooltipType', ${jsonStringifyWithSingleQuotes({detail: {selectedExtraData}})}))`;
                const a = `<a href="#${createHash ? createHash(selectedExtraData) : ''}" onclick="${dispatchEvent}"><small>${selectedExtraData}</small></a>&nbsp;`;
                const ba = selectedExtraData == tooltip.selectedExtraData ? `<b>${a}</b>` : a;
                return _subhead + "&nbsp;&nbsp;&nbsp;" + ba;
            }, "");
        }

        const ol = `<ol>${(listEnd ? [...list, listEnd] : list).map(l => "<li>" + l + "</li>").join("\n")}</ol>`;
        selectTooltip().html([headtext, subhead, head, ol, foot].join("<br>"));
    }
}

export const tooltipLink = (href: string, text: string) => `<a target="_blank" href="${href}"><span class="tooltip-link">${text}</span></a>`;
