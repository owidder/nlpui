import * as d3 from "d3";
import {Selection} from "d3-selection/index";

import "./tooltip.scss";

export type TooltipSelection = Selection<HTMLDivElement, any, HTMLElement, any>;
type TooltipCallback = (uid: string, d: any) => void;

interface Tooltip {
    divTooltip: TooltipSelection;
    onCallback: TooltipCallback;
    offCallback: TooltipCallback;
    renderCallback: TooltipCallback;
}

export const createTooltip = (onCallback: TooltipCallback, offCallback: TooltipCallback, renderCallback: TooltipCallback): Tooltip => {
    const divTooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    return {divTooltip, onCallback, offCallback, renderCallback}
}

const switchOnTooltip = (tooltip: Tooltip, pageX: number, pageY: number, uid: string, d: any) => {
    switchOffTooltip(tooltip);
    tooltip.divTooltip.property("uid", uid);
    tooltip.divTooltip.property("data", d);
    tooltip.onCallback(uid, d);
    tooltip.divTooltip
        .style("opacity", 1)
        .style('transform', `translate(${pageX}px, ${pageY}px)`);
}

export const switchOffTooltip = (tooltip: Tooltip) => {
    const d = tooltip.divTooltip.property("data");
    const uid = tooltip.divTooltip.property("uid");
    if(d && uid) {
        tooltip.offCallback(uid, d);
        tooltip.divTooltip.style("opacity", 0).style('transform', `translate(-1000px, -1000px)`);
    }
}

const isTooltipOn = (divTooltip: TooltipSelection) => divTooltip.style("opacity") == "1";

export const handleTooltip = (tooltip: Tooltip, event: MouseEvent, uid: string, d: any) => {
    event.preventDefault();
    if(isTooltipOn(tooltip.divTooltip) && tooltip.divTooltip.property("uid") === uid) {
        switchOffTooltip(tooltip);
    } else {
        const {pageX, pageY} = event;
        console.log(`x: ${pageX} / y: ${pageY}`)
        const on = () => switchOnTooltip(tooltip, pageX, pageY, uid, d);
        on();
        tooltip.divTooltip.on("mouseover", on);
        tooltip.renderCallback(uid, d);
    }
}
