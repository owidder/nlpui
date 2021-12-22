import * as d3 from "d3";
import {Selection} from "d3-selection/index";

import "./tooltip.scss";

export type TooltipSelection = Selection<HTMLDivElement, any, HTMLElement, any>;
type TooltipCallback = (uid: string, d: any, tooltip: Tooltip) => void;

export interface Tooltip {
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

export const createTooltip = (renderCallback: TooltipCallback, _pinMessage?: string, _unpinMessage?: string) => {
    console.log("create tooltip")
    d3.selectAll(".tooltip").remove();
    d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    const pinMessage = _pinMessage === undefined ? "right click to pin" : _pinMessage;
    const unpinMessage = _unpinMessage === undefined ? "right click to unpin" : _unpinMessage;
    const tooltip: Tooltip = {pinned: false, renderCallback, pinMessage, unpinMessage};

    d3.selectAll(".tooltip")
        .on("mouseenter", () => {
            console.log("set inFocus to true")
            tooltip.inFocus = true;
            showTooltip();
            redrawTooltip();
        })
        .on("mouseleave", () => {
            console.log("set inFocus to false")
            tooltip.inFocus = false;
            redrawTooltip();
        })

    d3.selectAll(".tooltip").data([tooltip]);
}

const _moveTooltip = (pageX: number, pageY: number) => {
    const divTooltip = d3.select("div.tooltip");
    divTooltip.style('transform', `translate(${pageX}px, ${pageY}px)`);
}

const isTooltipOn = () => d3.select("tooltip").style("opacity") == "1";

export const currentTooltip = (): Tooltip | void => {
    const data = d3.selectAll(".tooltip").data();
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
    d3.selectAll(".tooltip").style("opacity", 1);
}

export const hideTooltip = () => {
    d3.selectAll(".tooltip").style("opacity", 0);
}

export const toggleTooltip = () => {
    if(isTooltipOn()) {
        hideTooltip();
    } else {
        showTooltip();
    }
}

export const setTooltipData = (uid: string, d: any) => {
    const tooltip = currentTooltip();
    const divTooltip = d3.select(".tooltip");
    if(tooltip && divTooltip && !tooltip.pinned && divTooltip.property("uid") != uid) {
        divTooltip.property("uid", uid);
        divTooltip.property("data", d);
        tooltip.renderCallback(uid, d, tooltip);
    }
}
export const redrawTooltip = () => {
    const tooltip = currentTooltip();
    const divTooltip = d3.select(".tooltip");
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

export const doListEffect = async (head: string, foot: string, list: string[], listEnd?: string) => {
    const tooltip = currentTooltip();
    if(tooltip) {
        const headtext = tooltip.inFocus ? undefined : `<span class="tooltip-headtext">${tooltip.pinned ? tooltip.unpinMessage : tooltip.pinMessage}</span>`;
        const ol = `<ol>${(listEnd ? [...list, listEnd] : list).map(l => "<li>" + l + "</li>").join("\n")}</ol>`;
        d3.select(".tooltip").html([headtext, head, ol, foot].join("<br>"));
    }
}

export const tooltipLink = (href: string, text: string) => `<a target="_blank" href="${href}"><span class="tooltip-link">${text}</span></a>`;
