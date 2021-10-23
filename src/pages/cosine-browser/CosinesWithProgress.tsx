import * as React from "react";
import {useState, useEffect} from "react";
import * as _ from "lodash";
import * as d3 from "d3";

import {srcPathFromPath} from "../srcFromPath";
import {ProgressBar} from "../../progress/ProgressBar";
import {streamContentWithProgress} from "../stream/streamContentWithProgress";
import {handleTooltip, createTooltip, Tooltip} from "../../util/tooltip";

import "../styles.scss"

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

    const renderTooltip = (d: any) => {
        console.log(`render: ${d}`)
    }

    const tooltipOn = (uid: string) => {
        console.log(`on: ${uid}`)
    }

    const tooltipOff = (uid: string) => {
        console.log(`off: ${uid}`)
    }

    const addData = () => {
        setTimeout(() => {
            const tooltip = createTooltip(tooltipOn, tooltipOff, renderTooltip);
            d3.selectAll(".listrow")
                .data(cosineValues)
                .on("mousemove", (event, d) => handleTooltip(tooltip, event, d.document, d))
        });
    }

    const showCosines = <div className="list">
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
    
    if (progress > 0 && progressText.length > 0 && numberOfFiles > 0) {
        return <ProgressBar message={progressText} max={numberOfFiles} current={progress}/>
    } else if (cosineValues && cosineValues.length > 0) {
        addData();
        return showCosines;
    } else {
        return <span>WAITING!!!</span>
    }
}
