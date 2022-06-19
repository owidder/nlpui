import * as React from "react";
import {useState, useEffect} from "react";

import {WordAndMetrics} from "./metrics";
import {currentLocationWithNewHashValues, setNewHashValues} from "../../util/queryUtil2";

interface WordListProps {
    currentMetric: string
    wordsAndMetrics: WordAndMetrics[]
    initialOrderByAlpha: boolean
    initialFilter: string
}

export const WordList = ({currentMetric, wordsAndMetrics, initialOrderByAlpha, initialFilter}: WordListProps) => {
    const [orderByAlpha, setOrderByAlpha] = useState(initialOrderByAlpha);
    const [filter, setFilter] = useState(initialFilter);
    const [filterInputFieldValue, setFilterInputFieldValue] = useState(initialFilter);

    let filterDelayTimer;

    useEffect(() => {
       if(filterDelayTimer) {
           clearTimeout(filterDelayTimer);
       }

       setNewHashValues({filter: filterInputFieldValue})

       filterDelayTimer = setTimeout(() => {
           setFilter(filterInputFieldValue);
           filterDelayTimer = undefined
       }, 200)
    }, [filterInputFieldValue])

    const sortByMetricOrAlpha = (a: WordAndMetrics, b: WordAndMetrics): number => {
        if(orderByAlpha) {
            return a.stem.localeCompare(b.stem)
        } else {
            return b[currentMetric] - a[currentMetric]
        }
    }

    const sortedWordsAndMetrics = wordsAndMetrics.filter(wam => wam.stem.indexOf(filter) > -1).sort(sortByMetricOrAlpha);

    return <div className="directory list">
        <div className="listrow title">
            <div className="cell index">No.</div>
            <div className="cell string">stem and long words
                <a href={currentLocationWithNewHashValues({abc: orderByAlpha ? 1 : 0})} onClick={() => setOrderByAlpha(!orderByAlpha)}>{orderByAlpha ? "order by value" : "order by a-z"}</a>
                <input value={filterInputFieldValue} onChange={(e) => setFilterInputFieldValue(e.target.value)}/>
            </div>
            <div className="cell">{currentMetric}</div>
        </div>
        {sortedWordsAndMetrics.length > 0 ?
            sortedWordsAndMetrics.map((wordAndMetrics, index) => {
                return <div className="listrow" key={index}>
                    <div className="cell index">{index+1}</div>
                    <div className="cell string">
                        <a onClick={() => document.dispatchEvent(new CustomEvent('reload'))} href={currentLocationWithNewHashValues({feature: wordAndMetrics.stem, currentMetric})}>{wordAndMetrics.stem}</a>
                        &nbsp;[{wordAndMetrics.words.map((word, index2) => <span key={index2}>{word}{index2 < wordAndMetrics.words.length-1 ? ", " : ""}</span>)}]
                    </div>
                    <div className="cell">{wordAndMetrics[currentMetric].toFixed(currentMetric == "count" ? 0 : 2)}</div>
                </div>
            }) :
            <h5>???</h5>
        }
    </div>
}
