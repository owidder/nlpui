import * as React from "react";
import {useState, useEffect} from "react";
import {callApi} from "../../util/fetchUtil";
import {showTreemap, Tree} from "./treemapGraph";

interface TreemapProps {
    path: string
    width: number
    height: number
}

interface SubAgg {
    [name: string]: [{word: string, value: number}]
}

export const Treemap = ({path, width, height}: TreemapProps) => {
    useEffect(() => {
        callApi(`/api/subAgg/folder/${path}`).then((subAgg: SubAgg) => {
            const children: Tree[] = Object.keys(subAgg).map(name => {
                return {name, children: subAgg[name].map(({word, value}) => {
                        return {name: word, value}
                })}})
            const tree: Tree = {name: "root", children}
            showTreemap("#treemap", tree, width, height)
        })
    })

    return <div id="treemap"></div>
}
