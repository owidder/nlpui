import * as React from "react";
import {useState, useEffect} from "react";
import * as _ from "lodash";

import {callApi} from "../../util/fetchUtil";
 import {srcPathFromPath} from "../srcFromPath";

import "../styles.scss"

interface CosinesProps {
    document: string
    staticCall?: boolean
}

interface CosineValue {
    document: string
    cosine: number
}
export const Cosines = ({document, staticCall}: CosinesProps) => {
    const [cosineValues, setCosineValues] = useState([] as CosineValue[])

    useEffect(() => {
        const url = staticCall ? `src/folder/${document}` : `/api/cosineValues?doc1=${document}`
        callApi(url).then((_cosineValues: CosineValue[]) => {
            const sortedCosineValues = _.sortBy(_cosineValues, cv => -cv.cosine)
            setCosineValues([{document, cosine: 1}, ...sortedCosineValues])
        })
    }, [document])

    return <div className="list">
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
}
