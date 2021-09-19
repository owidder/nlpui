import * as React from "react";
import {useEffect, useState} from "react";
import {showTreemap} from "./treemapGraph";
import {streamContentWithProgress} from "../stream/streamContentWithProgress";

import "./tree.scss"
import {ProgressBar} from "../../progress/ProgressBar";

interface TreemapWithProgressProps {
    path: string
    width: number
    height: number
}

export const TreemapWithProgress = ({path, width, height}: TreemapWithProgressProps) => {
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState("");
    const [numberOfFiles, setNumberOfFiles] = useState(0);

    useEffect(() => {
        streamContentWithProgress(`/api/subAgg/folder/${path}`,
            setProgress, setNumberOfFiles, setProgressText,
            tree => showTreemap("#treemap", tree, width, height));
    }, [])

    return <div id="treemap">
        {
            (progress > 0 && progressText.length > 0 && numberOfFiles > 0) ?
                <ProgressBar message={progressText} max={numberOfFiles} current={progress}/> : <span/>
        }
    </div>
}
