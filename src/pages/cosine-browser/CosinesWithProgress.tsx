import * as React from "react";
import {useState, useEffect} from "react";

import {callStreamApi} from "../../util/fetchUtil";
 import {srcPathFromPath} from "../srcFromPath";

import "../styles.scss"

interface CosinesWithProgressProps {
    document: string
}

interface CosineValue {
    document: string
    cosine: number
}

const PROGRESS_PREFIX = "progress:";
const JSON_PREFIX = "json:";

export const CosinesWithProgress = ({document}: CosinesWithProgressProps) => {
    const [cosineValues, setCosineValues] = useState([] as CosineValue[])
    const [progress, setProgress] = useState("");

    useEffect(() => {
        callStreamApi(`/api/cosineValuesWithProgress?doc1=${document}`, content => {
            if(content.startsWith(PROGRESS_PREFIX)) {
                setProgress(content.substr(PROGRESS_PREFIX.length))
            } else if(content.startsWith(JSON_PREFIX)) {
                setProgress("");
                setCosineValues(JSON.parse(content.substr(JSON_PREFIX.length)));
            }
        })
    }, [document])

    const showCosines = <div className="list">
            {cosineValues.map((cosineValue, index) => {
                return <div className="listrow" key={index}>
                    <div className="cell index">{index}</div>
                    <div className="cell string">
                        <a className="pointer" href={srcPathFromPath(cosineValue.document)} target="_blank">{cosineValue.document}</a>
                    </div>
                    <div className="cell"><a target="_blank" href={`/feature-table/feature-table.html#path=${cosineValue.document}`}>{cosineValue.cosine.toFixed(2)}</a></div>
                </div>
            })}
        </div>

    const showProgress = <div>{progress}</div>

    if(progress && progress.length > 0) {
        return showProgress;
    } else if(cosineValues && cosineValues.length > 0) {
        return showCosines;
    } else {
        return <span></span>
    }
}
