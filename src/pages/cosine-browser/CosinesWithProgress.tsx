import * as React from "react";
import {useState, useEffect} from "react";
import * as _ from "lodash";
import * as d3 from "d3";

import {srcPathFromPath} from "../srcFromPath";
import {ProgressBar} from "../../progress/ProgressBar";
import {streamContentWithProgress} from "../stream/streamContentWithProgress";
import {
    createTooltip,
    doListEffect,
    moveTooltip,
    showTooltip,
    hideTooltip,
    setTooltipData,
    Event,
    togglePinTooltip,
    tooltipLink
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

let shortlist = true;

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

    let showAllListener;

    const renderTooltip = (documentPath: string, features: Feature[]) => {
        if (!features) return;

        if(showAllListener) {
            document.removeEventListener("showall", showAllListener);
        }
        showAllListener = () => {
            console.log("show all");
            shortlist = false;
            renderTooltip(documentPath, features);
        };
        document.addEventListener("showall", showAllListener)

        const listHead = `<span class="tooltip-title">${documentPath}</span>`;
        let list = features.filter(f => shortlist ? f.value > 0.1 : f).map(f => `${f.feature} <small>[${f.value.toFixed(2)}]</small>`);
        let listFood = tooltipLink(`/cosine-browser/cosine-browser.html#path=${documentPath}`, "Show similar documents")
            + "<br/>"
            + tooltipLink(srcPathFromPath(documentPath), "Show source");

        let listEnd;
        if(shortlist && list.length < features.length) {
            listEnd = `<a class="fakelink" onclick="document.dispatchEvent(new CustomEvent('showall'))">show all...</a><br/>`;
        }

        doListEffect(listHead, listFood, list, listEnd);
    }

    const enter = (event: Event, d: { document: string, features?: Feature[] }) => {
        if (!d.features) {
            callApi(`/api/features?doc1=${d.document}`).then((features: Feature[]) => {
                d.features = features;
                setTooltipData(d.document, features);
                showTooltip();
            })
        } else {
            setTooltipData(d.document, d.features)
            showTooltip();
        }
    }

    const handleList = (cosineValues: CosineValue[]) => {
        d3.selectAll(".list")
            .on("mouseenter", (event) => {
                moveTooltip(event);
            })
            .on("mouseleave", () => {
                hideTooltip()
            })

        d3.select(".list").selectAll((".listrow"))
            .data(cosineValues, (_, i) => cosineValues[i].document)
            .on("mousemove", (event) => {
                moveTooltip(event);
            })
            .on("mouseenter", function(event, d) {
                shortlist = true;
                d3.select(this).classed("selected", true);
                enter(event, d);
            })
            .on("mouseleave", function () {
                d3.select(this).classed("selected", false)
            })
            .on("contextmenu", (event, d: any) => {
                event.preventDefault();
                togglePinTooltip();
                enter(event, d);
                moveTooltip(event);
            })
    }

    const showCosines = () => {
        setTimeout(() => handleList(cosineValues), 10);
        return <div className="list">
            {cosineValues.map((cosineValue, index) => {
                return <div className="listrow" key={index}>
                    <div className="cell index">{index}</div>
                    <div className="cell string">
                        <span className="document-path">{cosineValue.document}</span>
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
        createTooltip(renderTooltip);
        return showCosines();
    } else {
        return <span>WAITING!!!</span>
    }
}
