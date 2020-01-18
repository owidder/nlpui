import * as React from "react";
import {useState, useEffect} from "react";
import * as _ from "lodash";

import {callApi} from "../../util/fetchUtil";

import "../styles.scss"

interface CosinesProps {
    document: string
    clickHandler: (string) => void
    highlightDocName?: string
}

interface CosineValue {
    document: string
    cosine: number
}

export const Cosines = ({document, clickHandler, highlightDocName}: CosinesProps) => {
    const [cosineValues, setCosineValues] = useState([] as CosineValue[])

    useEffect(() => {
        callApi(`cosineValues?doc1=${document}`).then((_cosineValues: CosineValue[]) => {
            const sortedCosineValues = _.sortBy(_cosineValues, cv => -cv.cosine)
            setCosineValues([{document, cosine: 1}, ...sortedCosineValues])
        })
    }, [document])

    const classForDocName = (docName: string) => {
        return highlightDocName == docName ? "pointer highlight" : "pointer";
    }

    return <div className="list">
        {cosineValues.map((cosineValue, index) => {
            const docName = cosineValue.document.split("/")[1].split(".")[0]
            return <div className="listrow" key={index}>
                <div className="cell index">{index}</div>
                <div className="cell string">
                    <a className={classForDocName(docName)}
                       onClick={() => clickHandler(docName)}>{docName}
                    </a>
                </div>
                <div className="cell">{cosineValue.cosine.toFixed(2)}</div>
            </div>
        })}
    </div>
}
