import * as React from "react";
import {useState, useEffect} from "react";
import * as _ from "lodash";

import {srcPathFromPath} from "../srcFromPath";
import {ProgressBar} from "../../progress/ProgressBar";
import {streamContentWithProgress} from "../stream/streamContentWithProgress";
import {handleTooltip, createTooltip, Tooltip, doListEffect, TooltipSelection} from "../../util/tooltip";
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

    const _render = (documentPath: string, features: Feature[], divTooltip: TooltipSelection) => {
        const listHead = `<a target="_blank" href="/cosine-browser/cosine-browser.html#path=${documentPath}"><span style="font-size: small; text-decoration: underline">${documentPath}</span></a>`;
        const list = features.map(f => `${f.feature} <small>[${f.value.toFixed(2)}]</small>`);
        doListEffect(divTooltip, listHead, "", list);
    }

    const renderTooltip = (documentPath: string, d: {features?: Feature[]}, divTooltip: TooltipSelection) => {
        if(!d.features) {
            d.features = [];
            callApi(`/api/features?doc1=${documentPath}`).then((_features: Feature[]) => {
                d.features = _features;
                _render(documentPath, _features, divTooltip);
            })
        } else {
            _render(documentPath, d.features, divTooltip);
        }
    }

    const showCosines = (tooltip: Tooltip) => {
        return <div className="list">
            {cosineValues.map((cosineValue, index) => {
                return <div className="listrow" key={index} onMouseMove={(event) => handleTooltip(tooltip, event, cosineValue.document, cosineValue)}>
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
        return showCosines(tooltip);
    } else {
        return <span>WAITING!!!</span>
    }
}
