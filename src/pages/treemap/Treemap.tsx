import * as React from "react";
import {useEffect} from "react";
import {callApi} from "../../util/fetchUtil";
import {showTreemap, Tree} from "./treemapGraph";

import "./tree.scss"

interface TreemapProps {
    path: string
    width: number
    height: number
}

export const Treemap = ({path, width, height}: TreemapProps) => {
    useEffect(() => {
        callApi(`/api/subAgg/folder/${path}`).then((tree: Tree) => {
            showTreemap("#treemap", tree, width, height)
        })
    })

    return <div id="treemap"></div>
}
