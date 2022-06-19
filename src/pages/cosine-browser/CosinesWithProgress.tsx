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
    feature?: string
    srcPathMap?: any
}

interface CosineValue {
    document: string
    cosine: number
    tfidfValueOfFeature?: number
}

let rootFeatures: String[][] = [];

export const CosinesWithProgress = ({doc, feature, srcPathMap, searchStem}: CosinesWithProgressProps) => {
    const [cosineValues, setCosineValues] = useState([] as CosineValue[])
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState("");
    const [numberOfFiles, setNumberOfFiles] = useState(0);

    useEffect(() => {
        if(searchStem) {
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
        (feature: string) => currentLocationWithNewHashValues({path: doc, feature}),
        (feature: string[]) => {
            for(let i = 0; i < rootFeatures.length; i++) {
                for(let j = 0; j < feature.length; j++) {
                    if(rootFeatures[i].indexOf(feature[j]) > -1) {
                        return true;
                    }
                }
            }

            return false
        },
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
        rootFeatures = (await readFeatures(cosineValues[0].document)).map(f => f.features);
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
                return <div className="listrow" key={index} style={searchStem ? {} : {backgroundColor}}>
                    <div className="cell index">{index}</div>
                    <div className="cell string">
                        <span><SrcPathLink path={cosineValue.document} srcPathMap={srcPathMap}/></span>
                        &nbsp;<span className="document-path">{cosineValue.document}</span>
                        <span className="small-value">{value}</span>
                    </div>
                    <div className="cell">{cosineValue.cosine.toFixed(2)}</div>
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
