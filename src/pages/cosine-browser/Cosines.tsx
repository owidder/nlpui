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
const ERPNEXT_CODE_PREFIX = "erpnext/code/";
const ERPNEXT_DOCS_PREFIX = "erpnext/docs/";
const AXELOR_PREFIX = "axelor-open-suite/";
const DOLIBARR_PREFIX = "dolibarr/";
const ADEMPIERE_PREFIX = "adempiere/";
const METAFRESH_CODE_PREFIX = "metafresh/code/"
const METAFRESH_DOCS_PREFIX = "metafresh/doc/"

const ERPNEXT_CODE_ROOT = "https://github.com/frappe/erpnext/tree/develop/erpnext"
const ERPNEXT_DOCS_ROOT = "https://github.com/frappe/erpnext_documentation/tree/master/erpnext_documentation/www/docs/v13/user/manual/en"
const AXELOR_CODE_ROOT = "https://github.com/axelor/axelor-open-suite/blob/master/"
const DOLIBARR_CODE_ROOT = "https://github.com/Dolibarr/dolibarr/tree/develop/";
const ADEMPIERE_CODE_ROOT = "https://github.com/adempiere/adempiere/tree/develop/";
const METAFRESH_CODE_ROOT = "https://github.com/metasfresh/metasfresh/blob/master/";
const METAFRESH_DOCS_ROOT = "https://github.com/metasfresh/metasfresh-documentation/tree/gh-pages/";

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
        if(path.startsWith(ERPNEXT_CODE_PREFIX)) {
            return _path.join(ERPNEXT_CODE_ROOT, path.substr(ERPNEXT_CODE_PREFIX.length))
        } else if(path.startsWith(ERPNEXT_DOCS_PREFIX)) {
            return _path.join(ERPNEXT_DOCS_ROOT, path.substr(ERPNEXT_DOCS_PREFIX.length))
        } else if(path.startsWith(AXELOR_PREFIX)) {
            return _path.join(AXELOR_CODE_ROOT, path.substr(AXELOR_PREFIX.length))
        } else if(path.startsWith(DOLIBARR_PREFIX)) {
            return _path.join(DOLIBARR_CODE_ROOT, path.substr(DOLIBARR_PREFIX.length))
        } else if(path.startsWith(ADEMPIERE_PREFIX)) {
            return _path.join(ADEMPIERE_CODE_ROOT, path.substr(ADEMPIERE_PREFIX.length))
        } else if(path.startsWith(METAFRESH_CODE_PREFIX)) {
            return _path.join(METAFRESH_CODE_ROOT, path.substr(METAFRESH_CODE_PREFIX.length))
        } else if(path.startsWith(METAFRESH_DOCS_PREFIX)) {
            return _path.join(METAFRESH_DOCS_ROOT, path.substr(METAFRESH_DOCS_PREFIX.length))
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
