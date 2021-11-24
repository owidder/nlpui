import * as React from "react";
import {useState, useEffect} from "react";
import * as _ from "lodash";
import * as d3 from "d3";

import {srcPathFromPath} from "../srcFromPath";
import {ProgressBar} from "../../progress/ProgressBar";
import {streamContentWithProgress} from "../stream/streamContentWithProgress";
import {createTooltip, Tooltip, doListEffect, TooltipSelection, moveTooltip, showTooltip, hideTooltip, setTooltipData} from "../../util/tooltip";
import {Feature} from "../Feature";

import "../styles.scss"
import {callApi} from "../../util/fetchUtil";

interface CosinesWithProgressProps {
    doc: string
}

interface CosineValue {
    document: string
    cosine: number
}

let moveTooltipDelayTimeout;
let hideTooltipDelayTimeout;
let setTooltipDataDelayTimeout;
let renderTooltipDelayTimeout;
let firstEnter = true;

const _moveTooltip = (event, tooltip) => {
    showTooltip(tooltip);
    console.log(`moveTooltip: ${event.x} / ${event.y}`)
    moveTooltipDelayTimeout = setTimeout(() => {
        if(moveTooltipDelayTimeout) {
            moveTooltip(tooltip, event)
        }
    }, 500)
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

    const renderTooltip = (documentPath: string, features: Feature[], divTooltip: TooltipSelection) => {
        if(renderTooltipDelayTimeout) {
            clearTimeout(renderTooltipDelayTimeout);
            renderTooltipDelayTimeout = undefined;
        }
        renderTooltipDelayTimeout = setTimeout(() => {
            const listHead = `<a target="_blank" href="/cosine-browser/cosine-browser.html#path=${documentPath}"><span style="font-size: small; text-decoration: underline">${documentPath}</span></a>`;
            const list = features.map(f => `${f.feature} <small>[${f.value.toFixed(2)}]</small>`);
            doListEffect(divTooltip, listHead, "", list);
        }, 300)
    }

    const enter = (tooltip: Tooltip, d: {document: string, features?: Feature[]}) => {
        if(setTooltipDataDelayTimeout) {
            clearTimeout(setTooltipDataDelayTimeout)
        }
        if(!d.features) {
            setTooltipDataDelayTimeout = setTimeout(() => {
                if(setTooltipDataDelayTimeout) {
                    callApi(`/api/features?doc1=${d.document}`).then((features: Feature[]) => {
                        d.features = features;
                        setTooltipData(tooltip, d.document, features);
                    })
                }
            }, 10);
        } else {
            setTooltipDataDelayTimeout = setTimeout(() => {
                if(setTooltipDataDelayTimeout) {
                    setTooltipData(tooltip, d.document, d.features)
                }
            }, 100);
        }
    }

    const handleList = (tooltip: Tooltip, cosineValues: CosineValue[]) => {
        d3.selectAll(".list")
            .on("mouseenter", (event) => {
                showTooltip(tooltip);
                if(firstEnter) {
                    firstEnter = false;
                    _moveTooltip(event, tooltip);
                }
            })
            .on("mouseleave", () => {
                hideTooltipDelayTimeout = setTimeout(() => {
                    if(hideTooltipDelayTimeout) {
                        hideTooltip(tooltip)
                    }
                }, 300);
            });

        d3.select(".list").selectAll((".listrow"))
            .data(cosineValues, (_, i) => cosineValues[i].document)
            .on("mousemove", (event) => {
                _moveTooltip(event, tooltip);
            })
            .on("mouseenter", (event, d) => enter(tooltip, d))
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
        const tooltip = createTooltip(() => {}, () => {}, renderTooltip);
        tooltip.divTooltip.on("mouseenter", () => {
            if(moveTooltipDelayTimeout) {
                clearTimeout(moveTooltipDelayTimeout);
                moveTooltipDelayTimeout = undefined;
            }
            if(hideTooltipDelayTimeout) {
                clearTimeout(hideTooltipDelayTimeout);
                hideTooltipDelayTimeout = undefined;
            }
            if(setTooltipDataDelayTimeout) {
                clearTimeout(setTooltipDataDelayTimeout);
                setTooltipDataDelayTimeout = undefined;
            }
            showTooltip(tooltip)
        });
        return showCosines(tooltip);
    } else {
        return <span>WAITING!!!</span>
    }
}
