import * as d3 from "d3";
import {Selection} from "d3-selection/index";

import "./tooltip.scss";

export type TooltipSelection = Selection<HTMLDivElement, any, HTMLElement, any>;
type TooltipCallback = (uid: string, d: any, divTooltip: TooltipSelection) => void;

export interface Tooltip {
    divTooltip: TooltipSelection;
    onCallback: TooltipCallback;
    offCallback: TooltipCallback;
    renderCallback: TooltipCallback;
}

interface Event {
    pageX: number;
    pageY: number;
    preventDefault: () => void
}

export const createTooltip = (onCallback: TooltipCallback, offCallback: TooltipCallback, renderCallback: TooltipCallback): Tooltip => {
    const divTooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    const tooltip: Tooltip = {divTooltip, onCallback, offCallback, renderCallback};

    d3.select(".tooltip")
        .on("mouseenter", () => showTooltip(tooltip));

    return tooltip
}

const switchOnTooltip = (tooltip: Tooltip, pageX: number, pageY: number, uid: string, d: any) => {
    switchOffTooltip(tooltip);
    setTooltipData(tooltip, uid, d);
    tooltip.onCallback(uid, d, tooltip.divTooltip);
    showTooltip(tooltip);
    _moveTooltip(tooltip, pageX, pageY);
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
        tooltip.offCallback(uid, d, tooltip.divTooltip);
    }
    hideTooltip(tooltip);
}

const isTooltipOn = (divTooltip: TooltipSelection) => divTooltip.style("opacity") == "1";

export const moveTooltip = (tooltip: Tooltip, event: Event) => {
    event.preventDefault();
    const {pageX, pageY} = event;
    _moveTooltip(tooltip, pageX+10, pageY+10);
}

export const showTooltip = (tooltip: Tooltip) => {
    console.log("showTooltip")
    tooltip.divTooltip.style("opacity", 1);
}

export const hideTooltip = (tooltip: Tooltip) => {
    tooltip.divTooltip.style("opacity", 0).style('transform', `translate(-1000px, -1000px)`);
}

export const toggleTooltip = (tooltip: Tooltip) => {
    if(isTooltipOn(tooltip.divTooltip)) {
        hideTooltip(tooltip);
    } else {
        showTooltip(tooltip);
    }
}

export const setTooltipData = (tooltip: Tooltip, uid: string, d: any) => {
    if(tooltip.divTooltip.property("uid") != uid) {
        tooltip.divTooltip.property("uid", uid);
        tooltip.divTooltip.property("data", d);
        tooltip.renderCallback(uid, d, tooltip.divTooltip);
    }
}

export const handleTooltip = (tooltip: Tooltip, event: Event, uid: string, d: any) => {
    event.preventDefault();
    if(isTooltipOn(tooltip.divTooltip) && tooltip.divTooltip.property("uid") === uid) {
        switchOffTooltip(tooltip);
    } else {
        const {pageX, pageY} = event;
        const on = () => switchOnTooltip(tooltip, pageX, pageY, uid, d);
        on();
        tooltip.divTooltip.on("mouseover", on);
        tooltip.renderCallback(uid, d, tooltip.divTooltip);
    }
}

export const doListEffect = async (targetElement, head: string, foot: string, list: string[]) => {
    for(let i = 0; i < list.length; i++) {
        await new Promise(resolve => {
            setTimeout(() => {
                const ol = `<ol>${list.slice(0, i).map(l => "<li>" + l + "</li>").join("\n")}</ol>`;
                targetElement.html([head, ol, foot].join("<br>"));
                resolve()
            }, 10)
        })
    }
}
