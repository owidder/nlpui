import * as React from "react";
import {useState, useEffect} from "react";
import * as _ from "lodash";
import * as d3 from "d3";

import {ProgressBar} from "../../progress/ProgressBar";
import {streamContentWithProgress} from "../stream/streamContentWithProgress";
import {
    createTooltip,
    removeAllTooltips,
    moveTooltip,
    showTooltip,
    hideTooltip,
    setTooltipData,
    Event,
    togglePinTooltip,
    tooltipLink
} from "../../util/tooltip";
import {Feature} from "../Feature";
import {FeatureTooltipRenderer} from "./FeatureTooltipRenderer";

import "../styles.scss"
import "./cosines.scss"
import {callApi} from "../../util/fetchUtil";
import {wordSearchColor} from "../../wordSearch/wordSearchColor";
import {currentLocationWithNewHashValues} from "../../util/queryUtil2";

import {SrcPathLink} from "./SrcPathLink";

interface CosinesWithProgressProps {
    doc?: string
    searchStem?: string
    searchFullWord?: string
    feature?: string
    srcPathMap?: any
}

interface CosineValue {
    document: string
    cosine: number
    tfidfValueOfFeature?: number
}

let rootStems: String[] = [];

export const CosinesWithProgress = ({doc, feature, srcPathMap, searchStem, searchFullWord}: CosinesWithProgressProps) => {
    const [cosineValues, setCosineValues] = useState([] as CosineValue[])
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState("");
    const [numberOfFiles, setNumberOfFiles] = useState(0);

    useEffect(() => {
        if(searchStem && searchFullWord) {
            callApi(`/api/searchStemAndFullWord?stem=${searchStem}&path=${doc}&fullword=${searchFullWord}`).then((result: CosineValue[]) => {
                const sortedResult = _.sortBy(result, cv => -cv.cosine);
                setCosineValues(sortedResult)
            })
        }
        else if(searchStem) {
            callApi(`/api/searchStem?stem=${searchStem}&path=${doc}`).then((result: CosineValue[]) => {
                const sortedResult = _.sortBy(result, cv => -cv.cosine);
                setCosineValues(sortedResult)
            })
        } else {
            streamContentWithProgress(`/api/cosineValuesWithProgress?doc1=${doc}&feature=${feature}`,
                setProgress,
                setNumberOfFiles,
                setProgressText,
                (_cosineValues: CosineValue[]) => {
                    const sortedCosineValues = _.sortBy(_cosineValues, cv => -cv.cosine);
                    setCosineValues(sortedCosineValues);
                })
        }

        return () => {
            removeAllTooltips()
        }
    }, [doc])

    const featureTooltipRenderer = new FeatureTooltipRenderer(
        (feature: string, fullWord?: string) => currentLocationWithNewHashValues({path: doc, feature, fullword: fullWord}),
        (stem: string) => rootStems.indexOf(stem) > -1,
        (documentPath: string) => tooltipLink(`/cosine-browser/cosine-browser.html#path=${documentPath}&feature=${feature}`, "Show similar documents")
    )

    const readFeatures = (document: string): Promise<Feature[]> => {
        return new Promise(resolve => {
            callApi(`/api/features?doc1=${document}`).then((features: Feature[]) => {
                resolve(features);
            })
        })
    }

    const enter = async (event: Event, d: { document: string, features?: Feature[] }) => {
        console.log("enter");
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
        rootStems = searchStem ? [searchStem] : (await readFeatures(cosineValues[0].document)).map(f => f.stem);
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
            <div className="litsrow title">
                <div className="cell index">No.</div>
                <div className="cell string">path</div>
                <div className="cell">{searchStem ? `tf-idf of "${searchStem}"` : "Cosine"}</div>
            </div>
            {cosineValues.map((cosineValue, index) => {
                const backgroundColor = wordSearchColor(cosineValue.tfidfValueOfFeature, maxTfidfValueOfFeature);
                const value = !searchStem && cosineValue.tfidfValueOfFeature ? ` (tf-idf of "${feature}": ${cosineValue.tfidfValueOfFeature})` : "";
                return <div className="listrow" key={index} style={{backgroundColor}}>
                    <div className="cell index">{index}</div>
                    <div className="cell string">
                        <span><SrcPathLink path={cosineValue.document} srcPathMap={srcPathMap}/></span>
                        &nbsp;<span className="document-path">{cosineValue.document}</span>
                        <span className="small-value">{value}</span>
                    </div>
                    <div className="cell">{searchStem ? cosineValue.tfidfValueOfFeature.toFixed(2) : cosineValue.cosine.toFixed(2)}</div>
                </div>
            })}
        </div>
    }

    if (progress > 0 && progressText.length > 0 && numberOfFiles > 0) {
        return <ProgressBar message={progressText} max={numberOfFiles} current={progress}/>
    } else if (cosineValues && cosineValues.length > 0) {
        createTooltip(featureTooltipRenderer.render.bind(featureTooltipRenderer));
        return showCosines();
    } else {
        return <span>WAITING!!!</span>
    }
}
