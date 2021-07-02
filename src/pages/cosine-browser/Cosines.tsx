import * as React from "react";
import {useState, useEffect} from "react";
import * as _ from "lodash";

import {callApi} from "../../util/fetchUtil";
import {docNameFromPath} from "./util";

import "../styles.scss"

interface CosinesProps {
    document: string
    clickHandler: (string) => void
    highlightDocName?: string
    staticCall?: boolean
}

interface CosineValue {
    document: string
    cosine: number
}

export const Cosines = ({document, clickHandler, highlightDocName, staticCall}: CosinesProps) => {
    const [cosineValues, setCosineValues] = useState([] as CosineValue[])

    useEffect(() => {
        const url = staticCall ? `src/folder/${document}` : `/api/cosineValues?doc1=${document}`
        callApi(url).then((_cosineValues: CosineValue[]) => {
            const sortedCosineValues = _.sortBy(_cosineValues, cv => -cv.cosine)
            setCosineValues([{document, cosine: 1}, ...sortedCosineValues])
        })
    }, [document])

    const classForDocName = (docName: string) => {
        return highlightDocName == docName ? "pointer highlight" : "pointer";
    }

    return <div className="list">
        {cosineValues.map((cosineValue, index) => {
            const docName = docNameFromPath(cosineValue.document)
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
