import * as d3 from "d3";
import {Selection} from "d3-selection/index";

import "./tooltip.scss";

export type TooltipSelection = Selection<HTMLDivElement, any, HTMLElement, any>;
type TooltipCallback = (uid: string, d: any, tooltip: Tooltip) => void;

export interface Tooltip {
    divTooltip: TooltipSelection;
    onCallback: TooltipCallback;
    offCallback: TooltipCallback;
    renderCallback: TooltipCallback;
    pinned: boolean;
    pinMessage: string;
    unpinMessage: string;
    inFocus?: boolean;
}

export interface Event {
    pageX: number;
    pageY: number;
    preventDefault: () => void
}

export const createTooltip = (onCallback: TooltipCallback, offCallback: TooltipCallback, renderCallback: TooltipCallback, _pinMessage?: string, _unpinMessage?: string): Tooltip => {
    d3.selectAll(".tooltip").remove();
    const divTooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    const pinMessage = _pinMessage === undefined ? "right click to pin" : _pinMessage;
    const unpinMessage = _unpinMessage === undefined ? "right click to unpin" : _unpinMessage;
    const tooltip: Tooltip = {pinned: false, divTooltip, onCallback, offCallback, renderCallback, pinMessage, unpinMessage};

    d3.selectAll(".tooltip")
        .on("mouseenter", () => {
            console.log("set inFocus to true")
            tooltip.inFocus = true;
            showTooltip(tooltip);
            redrawTooltip(tooltip);
        })
        .on("mouseleave", () => {
            console.log("set inFocus to false")
            tooltip.inFocus = false;
            unpinTooltip(tooltip);
            redrawTooltip(tooltip);
        })

    return tooltip
}

const switchOnTooltip = (tooltip: Tooltip, event: Event, uid: string, d: any) => {
    switchOffTooltip(tooltip);
    setTooltipData(tooltip, uid, d);
    tooltip.onCallback(uid, d, tooltip);
    showTooltip(tooltip);
    _moveTooltip(tooltip, event.pageX, event.pageY);
}

const _moveTooltip = (tooltip: Tooltip, pageX: number, pageY: number) => {
    tooltip.divTooltip
        .style('transform', `translate(${pageX}px, ${pageY}px)`);
}

export const switchOffTooltip = (tooltip: Tooltip) => {
    console.log("switchOff");
    const d = tooltip.divTooltip.property("data");
    const uid = tooltip.divTooltip.property("uid");
    if(d && uid) {
        tooltip.offCallback(uid, d, tooltip);
    }
    hideTooltip(tooltip);
}

const isTooltipOn = (divTooltip: TooltipSelection) => divTooltip.style("opacity") == "1";

export const moveTooltip = (tooltip: Tooltip, event: Event) => {
    event.preventDefault();
    const {pageX, pageY} = event;
    if(!tooltip.pinned) {
        _moveTooltip(tooltip, pageX+15, pageY+15);
    }
}

export const showTooltip = (tooltip: Tooltip) => {
    tooltip.divTooltip.style("opacity", 1);
}

export const hideTooltip = (tooltip: Tooltip) => {
    tooltip.divTooltip.style("opacity", 0)
}

export const toggleTooltip = (tooltip: Tooltip) => {
    if(isTooltipOn(tooltip.divTooltip)) {
        hideTooltip(tooltip);
    } else {
        showTooltip(tooltip);
    }
}

export const setTooltipData = (tooltip: Tooltip, uid: string, d: any) => {
    if(!tooltip.pinned && tooltip.divTooltip.property("uid") != uid) {
        tooltip.divTooltip.property("uid", uid);
        tooltip.divTooltip.property("data", d);
        tooltip.renderCallback(uid, d, tooltip);
    }
}
export const redrawTooltip = (tooltip: Tooltip) => {
    tooltip.renderCallback(tooltip.divTooltip.property("uid"), tooltip.divTooltip.property("data"), tooltip);
}

export const togglePinTooltip = (tooltip: Tooltip) => {
    tooltip.pinned = !tooltip.pinned;
    redrawTooltip(tooltip);
}

export const unpinTooltip = (tooltip: Tooltip) => {
    tooltip.pinned = false;
    redrawTooltip(tooltip);
}

export const handleTooltip = (tooltip: Tooltip, event: Event, uid: string, d: any) => {
    event.preventDefault();
    if(isTooltipOn(tooltip.divTooltip) && tooltip.divTooltip.property("uid") === uid) {
        switchOffTooltip(tooltip);
    } else {
        const on = () => switchOnTooltip(tooltip, event, uid, d);
        on();
        tooltip.divTooltip.on("mouseover", on);
        tooltip.renderCallback(uid, d, tooltip);
    }
}

export const doListEffect = async (tooltip: Tooltip, head: string, foot: string, list: string[], listEnd?: string) => {
    const headtext = tooltip.inFocus ? undefined : `<span class="tooltip-headtext">${tooltip.pinned ? tooltip.unpinMessage : tooltip.pinMessage}</span>`;
    const ol = `<ol>${(listEnd ? [...list, listEnd] : list).map(l => "<li>" + l + "</li>").join("\n")}</ol>`;
    tooltip.divTooltip.html([headtext, head, ol, foot].join("<br>"));
}
