import * as React from "react";
import {useState, useEffect} from "react";

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
            setCosineValues(_cosineValues)
        })
    }, [document])

    return <div>{JSON.stringify(cosineValues, null, 4)}</div>
}
