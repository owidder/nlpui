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
import {Feature, smallestFeatureValue, sortFeatures} from "../Feature";
import {addEventListener, removeAllEventListeners} from "../../util/listener";

import "../styles.scss"
import "./cosines.scss"
import {callApi} from "../../util/fetchUtil";
import {wordSearchColor} from "../../wordSearch/wordSearchColor";
import {currentLocationWithNewHashValues} from "../../util/queryUtil2";

interface CosinesWithProgressProps {
    doc: string
    feature?: string
}

interface CosineValue {
    document: string
    cosine: number
    tfidfValueOfFeature?: number
}

let rootFeatures: String[] = [];

export const CosinesWithProgress = ({doc, feature}: CosinesWithProgressProps) => {
    const [cosineValues, setCosineValues] = useState([] as CosineValue[])
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState("");
    const [numberOfFiles, setNumberOfFiles] = useState(0);

    useEffect(() => {
        streamContentWithProgress(`/api/cosineValuesWithProgress?doc1=${doc}&feature=${feature}`,
            setProgress,
            setNumberOfFiles,
            setProgressText,
            (_cosineValues: CosineValue[]) => {
                const sortedCosineValues = _.sortBy(_cosineValues, cv => -cv.cosine);
                setCosineValues(sortedCosineValues);
            })
    }, [doc])

    let shortlist = true;

    const renderTooltip = (documentPath: string, features: Feature[]) => {
        if (!features) return;

        const sortedFeatures = sortFeatures(features);
        const smallestValue = smallestFeatureValue(features);

        removeAllEventListeners("showall");
        addEventListener("showall", () => {
            console.log("showall")
            shortlist = false;
            renderTooltip(documentPath, sortedFeatures);
        });

        removeAllEventListeners("showless");
        addEventListener("showless", () => {
            console.log("showless")
            shortlist = true;
            renderTooltip(documentPath, sortedFeatures);
        });

        const showall = `<a class="fakelink tooltip-link" onclick="document.dispatchEvent(new CustomEvent('showall'))">show all...</a><br/>`;
        const showless = `<a class="fakelink tooltip-link" onclick="document.dispatchEvent(new CustomEvent('showless'))">show less...</a><br/>`;

        const list = sortedFeatures.filter(f => shortlist ? f.value > 0.1 : f).map(f => {
            const isHighlighted = rootFeatures.indexOf(f.feature) > -1;
            const href = currentLocationWithNewHashValues({path: doc, feature: f.feature})
            return `<span class="${isHighlighted ? 'highlight-feature' : 'lowlight-feature'}"><a href="${href}" onclick="document.dispatchEvent(new CustomEvent('reload'))">${f.feature} <small>[${f.value.toFixed(2)}]</small></a></span>`
        });
        let listFoot = tooltipLink(`/cosine-browser/cosine-browser.html#path=${documentPath}&feature=${feature}`, "Show similar documents")
            + "<br/>"
            + tooltipLink(srcPathFromPath(documentPath), "Show source");

        const listHead = `<span class="tooltip-title">${documentPath}</span>`
            + "<br>"
            + (shortlist ? ((smallestValue > 0.1) ? "<span/>" : showall) : ((smallestValue > 0.1) ? "<span/>" : showless));

        doListEffect(listHead, listFoot, list);
    }

    const readFeatures = (document: string): Promise<Feature[]> => {
        return new Promise(resolve => {
            callApi(`/api/features?doc1=${document}`).then((features: Feature[]) => {
                resolve(features);
            })
        })
    }

    const enter = async (event: Event, d: { document: string, features?: Feature[] }) => {
        if (!d.features) {
            const features = await readFeatures(d.document);
            d.features = features;
            setTooltipData(d.document, features);
            showTooltip();
        } else {
            setTooltipData(d.document, d.features)
            showTooltip();
        }
    }

    const handleList = async (cosineValues: CosineValue[]) => {
        rootFeatures = (await readFeatures(cosineValues[0].document)).map(f => f.feature);
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
        const maxTfidfValueOfFeature = cosineValues.reduce((_max, _cosineValue) =>
            _max < _cosineValue.tfidfValueOfFeature ? _cosineValue.tfidfValueOfFeature : _max, 0);
        return <div className="list">
            {cosineValues.map((cosineValue, index) => {
                const backgroundColor = wordSearchColor(cosineValue.tfidfValueOfFeature, maxTfidfValueOfFeature);
                const value = cosineValue.tfidfValueOfFeature ? ` (${cosineValue.tfidfValueOfFeature})` : "";
                return <div className="listrow" key={index} style={{backgroundColor}}>
                    <div className="cell index">{index}</div>
                    <div className="cell string">
                        <span className="document-path">{cosineValue.document}</span><span className="small-value">{value}</span>
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
