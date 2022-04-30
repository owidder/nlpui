import * as React from "react";

import {WordAndMetrics} from "./metrics";
import {srcPathFromPath} from "../srcFromPath";

interface WordListProps {
    path: string
    currentMetric: string
    wordsAndMetrics: WordAndMetrics[]
}

export const WordList = ({path, currentMetric, wordsAndMetrics}: WordListProps) => {

    const sortedWordsAndMetrics = wordsAndMetrics.sort((a, b) => b[currentMetric] - a[currentMetric]);

    return <div className="directory list">
        <a target="_blank" href={srcPathFromPath(path)}><h5 className="title">{path}</h5></a>
        {sortedWordsAndMetrics.length > 0 ?
            sortedWordsAndMetrics.map((wordAndMetrics, index) => {
                return <div className="listrow" key={index}>
                    <div className="cell index">{index}</div>
                    <div className="cell string">{wordAndMetrics.word}</div>
                    <div className="cell">{wordAndMetrics[currentMetric].toFixed(2)}</div>
                </div>
            }) :
            <h5>???</h5>
        }
    </div>
}
