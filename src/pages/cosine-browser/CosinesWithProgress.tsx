import * as React from "react";
import {useState, useEffect} from "react";
import * as _ from "lodash";

import {srcPathFromPath} from "../srcFromPath";
import {ProgressBar} from "../../progress/ProgressBar";
import {streamContentWithProgress} from "../stream/streamContentWithProgress";

import "../styles.scss"

interface CosinesWithProgressProps {
    document: string
}

interface CosineValue {
    document: string
    cosine: number
}

export const CosinesWithProgress = ({document}: CosinesWithProgressProps) => {
    const [cosineValues, setCosineValues] = useState([] as CosineValue[])
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState("");
    const [numberOfFiles, setNumberOfFiles] = useState(0);

    useEffect(() => {
        streamContentWithProgress(`/api/cosineValuesWithProgress?doc1=${document}`,
            setProgress,
            setNumberOfFiles,
            setProgressText,
            _cosineValues => {
                const sortedCosineValues = _.sortBy(_cosineValues, cv => -cv.cosine);
                setCosineValues([{document, cosine: 1}, ...sortedCosineValues]);
            })
    }, [document])

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
        return showCosines;
    } else {
        return <span>WAITING!!!</span>
    }
}
