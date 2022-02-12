// based on: https://observablehq.com/@d3/zoomable-treemap
import * as d3 from "d3";
import {v4 as uuidv4} from "uuid";
import * as _ from "lodash";

import {
    createTooltip,
    doListEffect,
    moveTooltip,
    setTooltipData,
    showTooltip, hideTooltip, togglePinTooltip, tooltipLink, Tooltip
} from "../../util/tooltip";

export interface Tree {
    name: string
    words?: string[]
    tfidfValues?: number[]
    sumValues?: number[]
    avgValues?: number[]
    maxValues?: number[]
    countValues?: number[]
    value?: number
    children?: Tree[]
}

export const showTreemap = (selector: string, data: Tree, width: number, height: number, newZoomtoCallback: (newZoomto: string) => void, zoomto: string) => {
    const tile = (node, x0, y0, x1, y1) => {
        d3.treemapBinary(node, 0, 0, width, height);
        for (const child of node.children) {
            child.x0 = x0 + child.x0 / width * (x1 - x0);
            child.x1 = x0 + child.x1 / width * (x1 - x0);
            child.y0 = y0 + child.y0 / height * (y1 - y0);
            child.y1 = y0 + child.y1 / height * (y1 - y0);
        }
    }

    const treemap = (data: Tree) => {
        const hierarchy = d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);
        return d3.treemap().tile(tile)(hierarchy);
    }

    const x = d3.scaleLinear().rangeRound([0, width]);
    const y = d3.scaleLinear().rangeRound([0, height]);

    const svg = d3.select(selector).append("svg")
        .attr("viewBox", [0.5, -30.5, width, height + 30].join(" "))
        .style("font", "10px sans-serif");

    const svgTreemap = svg.append("g").attr("class", "treemap");

    const treemapData = treemap(data);

    let group = svgTreemap.append("g")
        .call(render, treemapData, zoomto);

    function render(group, _root, _zoomto?: string, event?: MouseEvent) {
        const format = d3.format(",d");

        const lowlight = (d) => d === _root ? "#fff" : d.children ? "#ccc" : "#ddd";

        const _name = d => d.ancestors().reverse().map(d => d.data.name).join("/");

        const _path = d => {
            const name = _name(d);
            return name.startsWith("./") ? name.substr(2) : name
        }

        const renderTooltip = (__: string, d, tooltip: Tooltip) => {
            const showAttr = tooltip.selectedExtraData ? tooltip.selectedExtraData : "sum";
            const listHead = `<span class="tooltip-title">${_path(d)}</span>`;
            const dataObjArray = d.data.words.map((word, i) => {
                return {word,
                    magic: _.round(d.data.tfidfValues[i], 2),
                    sum: _.round(d.data.sumValues[i], 2),
                    max: _.round(d.data.maxValues[i], 2),
                    avg: _.round(d.data.avgValues[i], 2),
                    count: Number(d.data.countValues[i])}
            })
            const best = _.sortBy(dataObjArray, [showAttr]).reverse().slice(0, 20);
            const list = best.map(b => {
                const valStr = ["sum", "max", "avg", "count"].reduce((_valStr, attr) => {
                    const attr_value = `${attr}: ${b[attr]}`;
                    return _valStr + " " + (attr == showAttr ? `<b>${attr_value}</b>` : attr_value);
                }, "")
                return `${b.word} <small>[${valStr}]</small>`
            });
            const listFoot = tooltipLink(`/cosine-browser/cosine-browser.html#path=${_path(d)}`, "Show word cloud");
            doListEffect(listHead, listFoot, list);
        }

        createTooltip(renderTooltip, "Right click to pin", "Right click to unpin", ["sum", "max", "avg", "count"]);
        if(event) moveTooltip(event);

        const zoomtoOneLevel = (d) => {
            const partsOfZoomto = _zoomto.split("/");
            const firstPartOfZoomto = partsOfZoomto[0];
            if(d.data.name == firstPartOfZoomto) {
                setTimeout(() => {
                    zoomin(d, partsOfZoomto.slice(1).join("/"), 10)
                }, 10)
            }
        }

        const node = group
            .on("mouseenter", () => showTooltip())
            .on("mouseleave", () => hideTooltip())
            .selectAll("g")
            .data(_root.children.concat(_root))
            .join("g")
            .each(d => d.leafUid = `leaf-${uuidv4()}`);

        node.filter(d => d === _root ? d.parent : d.children)
            .attr("cursor", "pointer")
            .on("click", async (event: MouseEvent, d) => {
                event.preventDefault();
                hideTooltip();
                if(d === _root) {
                    newZoomtoCallback(_name(_root).split("/").slice(0, -1).join("/"));
                    zoomout(_root)
                    moveTooltip(event);
                } else {
                    newZoomtoCallback(_name(d));
                    zoomin(d);
                    moveTooltip(event);
                }
            })
            .each(d => {
                if(_zoomto) {
                    zoomtoOneLevel(d)
                }
            });

        const doContextMenu = (event: MouseEvent, d) => {
            event.preventDefault();
            togglePinTooltip();
            setTooltipData(d.leafUid, d)
            moveTooltip(event);
        }

        node.append("rect")
            .attr("id", d  => d.leafUid)
            .attr("fill", lowlight)
            .attr("stroke", "#fff")
            .on("mouseover", (event: MouseEvent, d) => setTooltipData(d.leafUid, d))
            .on("mousemove", (event: MouseEvent) => moveTooltip(event))
            .on("contextmenu", doContextMenu)

        node.append("clipPath")
            .attr("id", d => (d.clipUid = `clip-${uuidv4()}`))
            .append("use")
            .attr("href", d => `#${d.clipUid}`);

        node.append("text")
            .on("mouseover", (event: MouseEvent, d) => setTooltipData(d.leafUid, d))
            .on("mousemove", (event: MouseEvent) => setTimeout(() => moveTooltip(event), 50))
            .on("contextmenu", doContextMenu)
            .attr("clip-path", d => d.clipUid)
            .attr("font-weight", d => d === _root ? "bold" : null)
            .selectAll("tspan")
            .data(d => d === _root ? [_name(d), format(d.value)] : [d.data.name, ...d.data.words, format(d.value)])
            .join("tspan")
            .attr("x", 3)
            .attr("y", (d, i, nodes) => `${(i === nodes.length - 1 ? 1 : 0) * 0.3 + 1.1 + i * 0.9}em`)
            .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
            .attr("font-weight", (d, i, nodes) => {
                switch (i) {
                    case 0:
                        return "bolder"

                    case nodes.length-1:
                        return "lighter"

                    default:
                        return "normal"

                }
            })
            .html(d => {
                return `<a href="#">${d}</a>`
            });

        group.call(position, _root);
    }

    function position(group, _root) {
        group.selectAll("g")
            .attr("transform", d => d === _root ? `translate(0,-30)` : `translate(${x(d.x0)},${y(d.y0)})`)
            .select("rect")
            .attr("width", d => d === _root ? width : x(d.x1) - x(d.x0))
            .attr("height", d => d === _root ? 30 : y(d.y1) - y(d.y0));
    }

    // When zooming in, draw the new nodes on top, and fade them in.
    function zoomin(d, _zoomto?: string, duration?: number) {
        const group0 = group.attr("pointer-events", "none");
        const group1 = group = svgTreemap.append("g").call(render, d, _zoomto);

        x.domain([d.x0, d.x1]);
        y.domain([d.y0, d.y1]);

        return svgTreemap.transition()
            .duration(duration ? duration : 750)
            .call(t => group0.transition(t).remove()
                .call(position, d.parent))
            .call(t => group1.transition(t)
                .attrTween("opacity", () => {
                    return (n: number) => String(d3.interpolate(0, 1)(n));
                })
                .call(position, d))
            .end();
    }

    // When zooming out, draw the old nodes on top, and fade them out.
    function zoomout(d) {
        const group0 = group.attr("pointer-events", "none");
        const group1 = group = svgTreemap.insert("g", "*").call(render, d.parent);

        x.domain([d.parent.x0, d.parent.x1]);
        y.domain([d.parent.y0, d.parent.y1]);

        svgTreemap.transition()
            .duration(750)
            .call(t => group0.transition(t).remove()
                .attrTween("opacity", () => {
                    return (n: number) => String(d3.interpolate(1, 0)(n));
                })
                .call(position, d))
            .call(t => group1.transition(t)
                .call(position, d.parent));
    }

    return svgTreemap.node();
}
