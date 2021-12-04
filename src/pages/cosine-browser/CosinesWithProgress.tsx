import * as React from "react";
import {useState, useEffect} from "react";
import * as _ from "lodash";
import * as d3 from "d3";

import {srcPathFromPath} from "../srcFromPath";
import {ProgressBar} from "../../progress/ProgressBar";
import {streamContentWithProgress} from "../stream/streamContentWithProgress";
import {
    createTooltip,
    Tooltip,
    doListEffect,
    TooltipSelection,
    moveTooltip,
    showTooltip,
    hideTooltip,
    setTooltipData,
    Event
} from "../../util/tooltip";
import {Feature} from "../Feature";

import "../styles.scss"
import "./cosines.scss"
import {callApi} from "../../util/fetchUtil";

interface CosinesWithProgressProps {
    doc: string
}

interface CosineValue {
    document: string
    cosine: number
}

let pinned = false;

const moveTooltipIfUnpinned = (tooltip: Tooltip, event: Event) => {
    if (!pinned) {
        moveTooltip(tooltip, event);
    }
}

const setTooltipDataIfUnpinned = (tooltip: Tooltip, uid: string, d: any) => {
    if (!pinned) {
        setTooltipData(tooltip, uid, d)
    }
}

export const CosinesWithProgress = ({doc}: CosinesWithProgressProps) => {
    const [cosineValues, setCosineValues] = useState([] as CosineValue[])
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState("");
    const [numberOfFiles, setNumberOfFiles] = useState(0);

    useEffect(() => {
        streamContentWithProgress(`/api/cosineValuesWithProgress?doc1=${doc}`,
            setProgress,
            setNumberOfFiles,
            setProgressText,
            _cosineValues => {
                const sortedCosineValues = _.sortBy(_cosineValues, cv => -cv.cosine);
                setCosineValues([{document: doc, cosine: 1}, ...sortedCosineValues]);
            })
    }, [doc])

    const tooltipLink = (href: string, text: string) => `<a target="_blank" href="${href}"><span style="font-size: small; text-decoration: underline">${text}</span></a>`

    const renderTooltip = (documentPath: string, features: Feature[], divTooltip: TooltipSelection) => {
        const listHead = tooltipLink(`/cosine-browser/cosine-browser.html#path=${documentPath}`, "Show similar documents");
        const list = features.map(f => `${f.feature} <small>[${f.value.toFixed(2)}]</small>`);
        const listFood = tooltipLink(srcPathFromPath(documentPath), "Show source");
        doListEffect(divTooltip, listHead, listFood, list);
    }

    const enter = (tooltip: Tooltip, event: Event, d: { document: string, features?: Feature[] }) => {
        if (!d.features) {
            callApi(`/api/features?doc1=${d.document}`).then((features: Feature[]) => {
                d.features = features;
                setTooltipDataIfUnpinned(tooltip, d.document, features);
                showTooltip(tooltip);
            })
        } else {
            setTooltipDataIfUnpinned(tooltip, d.document, d.features)
            showTooltip(tooltip);
        }
    }

    const handleList = (tooltip: Tooltip, cosineValues: CosineValue[]) => {
        d3.selectAll(".list")
            .on("mouseenter", (event) => {
                moveTooltipIfUnpinned(tooltip, event);
            })
            .on("mouseleave", () => {
                hideTooltip(tooltip)
            })
            .on("contextmenu", (event) => {
                event.preventDefault();
                pinned = !pinned;
                moveTooltipIfUnpinned(tooltip, event);
            })

        d3.select(".list").selectAll((".listrow"))
            .data(cosineValues, (_, i) => cosineValues[i].document)
            .on("mousemove", (event) => {
                moveTooltipIfUnpinned(tooltip, event);
            })
            .on("mouseenter", function(event, d) {
                d3.select(this).classed("selected", true);
                enter(tooltip, event, d);
            })
            .on("mouseleave", function () {
                d3.select(this).classed("selected", false)
            })
    }

    const showCosines = (tooltip: Tooltip) => {
        setTimeout(() => handleList(tooltip, cosineValues), 10);
        return <div className="list">
            {cosineValues.map((cosineValue, index) => {
                return <div className="listrow" key={index}>
                    <div className="cell index">{index}</div>
                    <div className="cell string">
                        <a className="pointer" href={srcPathFromPath(cosineValue.document)}
                           target="_blank">{cosineValue.document}</a>
                    </div>
                    <div className="cell"><a target="_blank"
                                             href={`/feature-table/feature-table.html#path=${cosineValue.document}`}>{cosineValue.cosine.toFixed(2)}</a>
                    </div>
                </div>
            })}
        </div>
    }

    if (progress > 0 && progressText.length > 0 && numberOfFiles > 0) {
        return <ProgressBar message={progressText} max={numberOfFiles} current={progress}/>
    } else if (cosineValues && cosineValues.length > 0) {
        const tooltip = createTooltip(() => {
        }, () => {}, renderTooltip);
        tooltip.divTooltip
            .on("mouseenter", () => {
                showTooltip(tooltip)
            })
            .on("mouseleave", () => pinned = false)
        return showCosines(tooltip);
    } else {
        return <span>WAITING!!!</span>
    }
}
