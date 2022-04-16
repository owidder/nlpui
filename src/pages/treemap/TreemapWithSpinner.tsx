import * as React from "react";
import {useEffect, useState} from "react";
import {showTreemap} from "./treemapGraph";
import {streamContentWithProgress} from "../stream/streamContentWithProgress";
import {setHashValue, removeHashName} from "../../util/queryUtil2"
import ClimbingBoxLoader from "react-spinners/ClimbingBoxLoader";
import { css } from "@emotion/react";

const override = css`
  position: absolute;
  top: 50vh;
  left: 50vw;
`;

import "./tree.scss"

interface TreemapWithProgressProps {
    zoomto: string
    width: number
    height: number
    currentMetric: string
    feature?: string
}

const newZoomtoCallback = (newZoomto: string) => {
    if(newZoomto != "." && newZoomto.length > 0) {
        setHashValue("zoomto", newZoomto.startsWith("./") ? newZoomto.substr(2) : newZoomto)
    } else {
        removeHashName("zoomto")
    }
}

export const TreemapWithSpinner = ({width, height, zoomto, currentMetric, feature}: TreemapWithProgressProps) => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadingEnded = (tree: any) => {
            setLoading(false);
            showTreemap("#treemap", tree, width, height, newZoomtoCallback, zoomto, currentMetric, feature);
        }

        streamContentWithProgress(`/api/subAgg/folder/`,
            () => {}, () => {}, () => {}, loadingEnded);
    }, [])

    return <div id="treemap">
        {
            loading ? <ClimbingBoxLoader color="blue" css={override} loading={loading} size={100}/> : <span/>
        }
    </div>
}
