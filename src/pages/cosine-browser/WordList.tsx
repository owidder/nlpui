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
        {sortedWordsAndMetrics.length > 0 ?
            sortedWordsAndMetrics.map((wordAndMetrics, index) => {
                return <div className="listrow" key={index}>
                    <div className="cell index">{index}</div>
                    <div className="cell string">
                        {wordAndMetrics.word.map((word, index2) => <span key={index2} ><a onClick={() => document.dispatchEvent(new CustomEvent('reload'))} href={currentLocationWithNewHashValues({feature: word, currentMetric})}>{word}</a>&nbsp;</span>)}
                    </div>
                    <div className="cell">{wordAndMetrics[currentMetric].toFixed(currentMetric == "count" ? 0 : 2)}</div>
                </div>
            }) :
            <h5>???</h5>
        }
    </div>
}
