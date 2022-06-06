import * as React from "react";
import {useState} from "react";

import {WordAndMetrics} from "./metrics";
import {currentLocationWithNewHashValues} from "../../util/queryUtil2";

interface WordListProps {
    currentMetric: string
    wordsAndMetrics: WordAndMetrics[]
}

export const WordList = ({currentMetric, wordsAndMetrics}: WordListProps) => {
    const [orderByAlpha, setOrderByAlpha] = useState(false);

    const sortByMetricOrAlpha = (a: WordAndMetrics, b: WordAndMetrics): number => {
        if(orderByAlpha) {
            return a.stem.localeCompare(b.stem)
        } else {
            return b[currentMetric] - a[currentMetric]
        }
    }

    const sortedWordsAndMetrics = wordsAndMetrics.sort(sortByMetricOrAlpha);

    return <div className="directory list">
        <div className="listrow title">
            <div className="cell index">No.</div>
            <div className="cell string">stem and long words <a href={currentLocationWithNewHashValues({})} onClick={() => setOrderByAlpha(!orderByAlpha)}>{orderByAlpha ? "order by value" : "order by a-z"}</a></div>
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
