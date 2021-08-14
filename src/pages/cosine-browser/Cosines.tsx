import * as React from "react";
import {useState, useEffect} from "react";
import * as _ from "lodash";
const _path = require("path");

import {callApi} from "../../util/fetchUtil";
import {docNameFromPath} from "./util";

import "../styles.scss"

interface CosinesProps {
    document: string
    codeSrcRoot: string
    docsSrcRoot: string
    staticCall?: boolean
}

interface CosineValue {
    document: string
    cosine: number
}

const ERPNEXT_CODE_ROOT = "https://github.com/frappe/erpnext/tree/develop/erpnext"
const ERPNEXT_DOCS_ROOT = "https://github.com/frappe/erpnext_documentation/tree/master/erpnext_documentation/www/docs/v13/user/manual/en"
const AXELOR_SRC_ROOT = "https://github.com/axelor/axelor-open-suite/blob/master/"

export const Cosines = ({document, staticCall}: CosinesProps) => {
    const [cosineValues, setCosineValues] = useState([] as CosineValue[])

    useEffect(() => {
        const url = staticCall ? `src/folder/${document}` : `/api/cosineValues?doc1=${document}`
        callApi(url).then((_cosineValues: CosineValue[]) => {
            const sortedCosineValues = _.sortBy(_cosineValues, cv => -cv.cosine)
            setCosineValues([{document, cosine: 1}, ...sortedCosineValues])
        })
    }, [document])

    const srcPathFromPath = (path: string): string => {
        if(path.startsWith("erpnext/code/")) {
            return _path.join(ERPNEXT_CODE_ROOT, path.substr(13))
        } else if(path.startsWith("erpnext/docs/")) {
            return _path.join(ERPNEXT_DOCS_ROOT, path.substr(13))
        } else if(path.startsWith("axelor-open-suite/")) {
            return _path.join(AXELOR_SRC_ROOT, path.substr(18))
        }

        return "???"
    }

    return <div className="list">
        {cosineValues.map((cosineValue, index) => {
            const docName = docNameFromPath(cosineValue.document)
            return <div className="listrow" key={index}>
                <div className="cell index">{index}</div>
                <div className="cell string">
                    <a className="pointer" href={srcPathFromPath(cosineValue.document)} target="_blank">{docName}</a>
                </div>
                <div className="cell"><a target="_blank" href={`/feature-table/feature-table.html#path=${cosineValue.document}`}>{cosineValue.cosine.toFixed(2)}</a></div>
            </div>
        })}
    </div>
}
