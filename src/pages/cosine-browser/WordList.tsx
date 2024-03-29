import * as React from "react";
import {rank} from "d3-array";
import {useState, useEffect} from "react";

import {WordAndMetrics, METRICS} from "./metrics";
import {currentLocationWithNewHashValues, setNewHashValues} from "../../util/queryUtil2";
import {addEventListener, removeAllEventListeners} from "../../util/listener";

interface WordListProps {
    currentMetric: string
    wordsAndMetrics: WordAndMetrics[]
    initialOrderByAlpha: boolean
    initialFilter: string
    initialLengthWeightened: boolean
    initialUseWeightedTfIdf: boolean
}

const DELTA = 500;

const createRanksForMetric = (wordsAndMetrics: WordAndMetrics[], metric: string): [number[], number[]] => {
    const data0 = wordsAndMetrics.map(wam => wam[metric][0]);
    const ranks0 = rank(data0).map(r => wordsAndMetrics.length - r);
    const data1 = wordsAndMetrics.map(wam => wam[metric][1]);
    const ranks1 = rank(data1).map(r => wordsAndMetrics.length - r);

    return [[...ranks0], [...ranks1]];
}

export const WordList = ({currentMetric, wordsAndMetrics, initialOrderByAlpha, initialFilter, initialLengthWeightened, initialUseWeightedTfIdf}: WordListProps) => {
    const [orderByAlpha, setOrderByAlpha] = useState(initialOrderByAlpha);
    const [filter, setFilter] = useState(initialFilter);
    const [filterInputFieldValue, setFilterInputFieldValue] = useState(initialFilter);
    const [lengthWeightened, setLengthWeightened] = useState(initialLengthWeightened);
    const [useWeightedTfIdf, setUseWeightedTfIdf] = useState(initialUseWeightedTfIdf);
    const [currentEnd, setCurrentEnd] = useState(DELTA);

    let filterDelayTimer;
    removeAllEventListeners("atTop");
    removeAllEventListeners("atBottom");

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
            return a[currentMetric][useWeightedTfIdf ? 1 : 0] - b[currentMetric][useWeightedTfIdf ? 1 : 0]
        }
    }

    const weightedWordsAndMetrics = lengthWeightened ? wordsAndMetrics.map(wam => {
        return Object.keys(wam).reduce<WordAndMetrics>((_w, key) => {
            if (METRICS.indexOf(key) > -1 && key != "count") {
                return {..._w, [key]: [wam[key][0] * wam.stem.length, wam[key][1] * wam.stem.length]}
            } else {
                return {..._w, [key]: wam[key]}
            }
        }, {} as WordAndMetrics)
    }) : wordsAndMetrics;

    const metricRanks = METRICS.reduce<{[metric: string]: [number[], number[]]}>((_metricRanks, metric) => {
        return {..._metricRanks, [metric]: createRanksForMetric(weightedWordsAndMetrics, metric)}
    }, {})

    const rankedWordsAndMetrics = weightedWordsAndMetrics.map((wam, i) => {
        const rankedWam = Object.keys(wam).reduce<WordAndMetrics>((_w, key) => {
            if (METRICS.indexOf(key) > -1) {
                return {..._w, [key]: [metricRanks[key][0][i], metricRanks[key][1][i]], [`_${key}`]: wam[key]}
            } else {
                return {..._w, [key]: wam[key]}
            }
        }, {} as WordAndMetrics)

        return rankedWam;
    })

    const sortedRankedWordsAndMetrics = rankedWordsAndMetrics.filter(wam => wam.stem.indexOf(filter) > -1).sort(sortByMetricOrAlpha);

    addEventListener("atTop", () => {
        if(currentEnd > DELTA) {
            setCurrentEnd(DELTA);
        }
    })

    addEventListener("atBottom", () => {
        if(currentEnd < sortedRankedWordsAndMetrics.length - DELTA) {
            setCurrentEnd(currentEnd + DELTA);
        } else {
            setCurrentEnd(sortedRankedWordsAndMetrics.length);
        }
    })

    return <div className="directory list">

        <div className="listrow title">
            <div className="cell index">No.</div>
            <div className="cell string">
                <a href={currentLocationWithNewHashValues({abc: orderByAlpha ? 1 : 0})} onClick={() => setOrderByAlpha(!orderByAlpha)}>{orderByAlpha ? "order by value" : "order by a-z"}</a>
                <input value={filterInputFieldValue} onChange={(e) => {
                    setFilterInputFieldValue(e.target.value);
                }}/>
                <label><input className="filled-in" type="checkbox" checked={lengthWeightened} onChange={() => {
                    setNewHashValues({lw: lengthWeightened ? 0 : 1});
                    setLengthWeightened(!lengthWeightened);
                }}/><span>weight on length</span></label>
                <label><input className="filled-in" type="checkbox" checked={useWeightedTfIdf} onChange={() => {
                    setNewHashValues({tfw: useWeightedTfIdf ? 0 : 1});
                    setUseWeightedTfIdf(!useWeightedTfIdf);
                }}/><span>use weighted TfIdf</span></label>
            </div>
            {METRICS.map((metric, index) => <div key={index} className="cell">{metric}</div>)}
        </div>
        {sortedRankedWordsAndMetrics.length > 0 ?
            sortedRankedWordsAndMetrics.slice(0, currentEnd).map((wordAndMetrics, index) => {
                return <div className="listrow" key={index}>
                    <div className="cell index">{index+1}</div>
                    <div className="cell string">
                        <a onClick={() => document.dispatchEvent(new CustomEvent('reload'))} href={currentLocationWithNewHashValues({feature: wordAndMetrics.stem, currentMetric})}>{wordAndMetrics.stem}</a>
                        &nbsp;[{wordAndMetrics.words.map((word, index2) =>
                        <a onClick={() => document.dispatchEvent(new CustomEvent('reload'))} href={currentLocationWithNewHashValues({feature: wordAndMetrics.stem, currentMetric, fullword: word})} key={index2}>{word}{index2 < wordAndMetrics.words.length-1 ? ", " : ""}</a>)}]
                    </div>
                    {METRICS.map((metric, index) => {
                        const value = wordAndMetrics[metric][useWeightedTfIdf ? 1 : 0].toFixed(0);
                        const absValue = wordAndMetrics[`_${metric}`][useWeightedTfIdf ? 1 : 0].toFixed(0);
                        return <div title={absValue} key={index} className={`cell number ${currentMetric == metric ? "indexmetric" : ""}`}>{metric === "count" ? `${value} [${wordAndMetrics._count[0]}]` : value}</div>
                    })}
                </div>
            }) :
            <h5>???</h5>
        }
    </div>
}
