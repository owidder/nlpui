import * as React from "react";
import {useState, useEffect} from "react";
import * as _ from "lodash";

import {callApi} from "../../util/fetchUtil";

import "../styles.scss"

interface CosinesProps {
    document: string;
}

interface CosineValue {
    document: string;
    cosine: number;
}

export const Cosines = ({document}: CosinesProps) => {
    const [cosineValues, setCosineValues] = useState([] as CosineValue[])

    useEffect(() => {
        callApi(`cosineValues?doc1=${document}`).then((_cosineValues: CosineValue[]) => {
            const sortedCosineValues = _.sortBy(_cosineValues, cv => -cv.cosine)
            setCosineValues(sortedCosineValues)
        })
    }, [document])

    return <div className="list">
        {cosineValues.map((cosineValue, index) => <div className="listrow" key={index}>
            <div className="cell index">{index+1}</div>
            <div className="cell string">{cosineValue.document.split("/")[1].split(".")[0]}</div>
            <div className="cell">{cosineValue.cosine.toFixed(2)}</div>
        </div>)}
    </div>
}
