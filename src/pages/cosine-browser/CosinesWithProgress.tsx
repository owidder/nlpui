import * as React from "react";
import {useState, useEffect} from "react";
import * as _ from "lodash";

import {callStreamApi} from "../../util/fetchUtil";
import {srcPathFromPath} from "../srcFromPath";
import {ProgressBar} from "./ProgressBar";

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
    const [partial, setPartial] = useState("");

    const jsonTry = (content: string) => {
        try {
            const json = partial.length > 0 ? partial + content : content;
            const _cosineValues = JSON.parse(json);
            const sortedCosineValues = _.sortBy(_cosineValues, cv => -cv.cosine);
            setCosineValues([{document, cosine: 1}, ...sortedCosineValues]);
            setPartial("");
        } catch (e) {
            setPartial(partial + content);
        }
    }

    useEffect(() => {
        callStreamApi(`/api/cosineValuesWithProgress?doc1=${document}`, content => {
            if(content.startsWith(PROGRESS_PREFIX)) {
                setProgress(content.substr(PROGRESS_PREFIX.length))
            } else if(content.startsWith(JSON_PREFIX)) {
                setProgress("");
                jsonTry(content.substr(JSON_PREFIX.length));
            } else {
                jsonTry(content);
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

    const [current, max] = progress.split("/");

    if(progress && progress.length > 0) {
        return <ProgressBar max={Number(max)} current={Number(current)}/>
    } else if(cosineValues && cosineValues.length > 0) {
        return showCosines;
    } else if(partial && partial.length > 0) {
        return <span>{partial}</span>
    } else {
        return <span>WAITING!!!</span>
    }
}
