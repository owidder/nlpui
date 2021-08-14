import * as React from "react";
import {useState, useEffect} from "react";

import {callApi} from "../../util/fetchUtil";

import "../styles.scss"
import "../directory.scss";

interface FeatureTableProps {
    documentPath: string
}

interface Feature {
    feature: string
    value: number
}

export const FeatureTable = ({documentPath}: FeatureTableProps) => {
    const [features, setFeatures] = useState([] as Feature[])

    useEffect(() => {
        if(documentPath.length > 0) {
            callApi(`/api/features?doc1=${documentPath}`).then((_features: Feature[]) => {
                setFeatures(_features)
            })
        }
    }, [documentPath])

    return <div className="directory list">
        <h5 className="title">{documentPath}</h5>
        {features.length > 0 ?
            features.map((feature, index) => {
                    return <div className="listrow" key={index}>
                        <div className="cell index">{index}</div>
                        <div className="cell string">{feature.feature}</div>
                        <div className="cell">{feature.value.toFixed(2)}</div>
                    </div>
                }) :
            <h5>???</h5>
        }
    </div>
}
