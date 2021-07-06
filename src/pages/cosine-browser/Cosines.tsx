import * as React from "react";
import {useState, useEffect} from "react";
import * as _ from "lodash";
const _path = require("path");

import {callApi} from "../../util/fetchUtil";
import {docNameFromPath} from "./util";

import "../styles.scss"

interface CosinesProps {
    document: string
    srcRoot: string
    staticCall?: boolean
}

interface CosineValue {
    document: string
    cosine: number
}

export const Cosines = ({document, staticCall, srcRoot}: CosinesProps) => {
    const [cosineValues, setCosineValues] = useState([] as CosineValue[])

    useEffect(() => {
        const url = staticCall ? `src/folder/${document}` : `/api/cosineValues?doc1=${document}`
        callApi(url).then((_cosineValues: CosineValue[]) => {
            const sortedCosineValues = _.sortBy(_cosineValues, cv => -cv.cosine)
            setCosineValues([{document, cosine: 1}, ...sortedCosineValues])
        })
    }, [document])

    const srcPathFromPath = (path: string): string => {
        const realPath = path.split(".utf8")[0]
        return _path.join(srcRoot, realPath)
    }

    return <div className="list">
        {cosineValues.map((cosineValue, index) => {
            const docName = docNameFromPath(cosineValue.document)
            return <div className="listrow" key={index}>
                <div className="cell index">{index}</div>
                <div className="cell string">
                    <a className="pointer" href={srcPathFromPath(cosineValue.document)} target="_blank">{docName}</a>
                </div>
                <div className="cell">{cosineValue.cosine.toFixed(2)}</div>
            </div>
        })}
    </div>
}
