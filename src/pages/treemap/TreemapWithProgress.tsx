import * as React from "react";
import {useEffect, useState} from "react";
import {showTreemap} from "./treemapGraph";
import {streamContentWithProgress} from "../stream/streamContentWithProgress";
import {setHashValue, removeHashName} from "../../util/queryUtil2"

import "./tree.scss"
import {ProgressBar} from "../../progress/ProgressBar";

interface TreemapWithProgressProps {
    zoomto: string
    width: number
    height: number
    currentMetric: string
    feature?: string
}

const newZoomtoCallback = (newZoomto: string) => {
    if(newZoomto != "." && newZoomto.length > 0) {
        setHashValue("path", newZoomto.startsWith("./") ? newZoomto.substr(2) : newZoomto)
    } else {
        removeHashName("path")
    }
}

export const TreemapWithProgress = ({width, height, zoomto, currentMetric, feature}: TreemapWithProgressProps) => {
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState("");
    const [numberOfFiles, setNumberOfFiles] = useState(0);

    useEffect(() => {
        streamContentWithProgress(`/api/subAgg/folder/`,
            setProgress, setNumberOfFiles, setProgressText,
            tree => showTreemap("#treemap", tree, width, height, newZoomtoCallback, zoomto, currentMetric, feature));
    }, [])

    return <div id="treemap">
        {
            (progress > 0 && progressText.length > 0 && numberOfFiles > 0) ?
                <ProgressBar message={progressText} max={numberOfFiles} current={progress}/> : <span/>
        }
    </div>
}
