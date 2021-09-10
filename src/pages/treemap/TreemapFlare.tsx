import * as React from "react";
import {useState, useEffect} from "react";
import {callApi} from "../../util/fetchUtil";
import {showTreemap, Tree} from "./treemapGraph";
import {flare} from "./flare.json";

interface TreemapProps {
    path: string
    width: number
    height: number
}

interface SubAgg {
    [name: string]: [{word: string, value: number}]
}

export const TreemapFlare = ({path, width, height}: TreemapProps) => {
    useEffect(() => {
        // @ts-ignore
        showTreemap("#treemap", flare, window.innerWidth, window.innerHeight)
    })

    return <div id="treemap"></div>
}
