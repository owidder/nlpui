import * as React from "react";

import {WordAndMetrics} from "./metrics";
import {currentLocationWithNewHashValues} from "../../util/queryUtil2";

interface WordListProps {
    currentMetric: string
    wordsAndMetrics: WordAndMetrics[]
}

export const WordList = ({currentMetric, wordsAndMetrics}: WordListProps) => {

    const sortedWordsAndMetrics = wordsAndMetrics.sort((a, b) => b[currentMetric] - a[currentMetric]);

    return <div className="directory list">
        <div className="listrow title">
            <div className="cell index">No.</div>
            <div className="cell string">stem and long words</div>
            <div className="cell">{currentMetric}</div>
        </div>
        {sortedWordsAndMetrics.length > 0 ?
            sortedWordsAndMetrics.map((wordAndMetrics, index) => {
                return <div className="listrow" key={index}>
                    <div className="cell index">{index+1}</div>
                    <div className="cell string">
                        <span>{wordAndMetrics.stem}: </span>{wordAndMetrics.words.map((word, index2) => <span key={index2} ><a onClick={() => document.dispatchEvent(new CustomEvent('reload'))} href={currentLocationWithNewHashValues({feature: word, currentMetric})}>{word}</a>&nbsp;</span>)}
                    </div>
                    <div className="cell">{wordAndMetrics[currentMetric].toFixed(currentMetric == "count" ? 0 : 2)}</div>
                </div>
            }) :
            <h5>???</h5>
        }
    </div>
}
