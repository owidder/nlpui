import * as React from "react";
import {useEffect, useState} from "react";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4plugins_wordCloud from "@amcharts/amcharts4/plugins/wordCloud";
import * as _ from "lodash";

import {callApi} from "../../util/fetchUtil";
import {WordAndMetrics} from "./metrics";

interface WordCloudProps {
    path: string
    currentMetric: string
    wordsAndMetrics: WordAndMetrics[]
}

const createCloud = (path: string, editStopwords: boolean, currentMetric: string, wordsAndMetrics: WordAndMetrics[]) => {
    const chart = am4core.create("wordCloud", am4plugins_wordCloud.WordCloud);
    chart.fontFamily = "Courier New";
    const series = chart.series.push(new am4plugins_wordCloud.WordCloudSeries());
    series.randomness = 0;
    series.rotationThreshold = 0.5;
    const best = _.sortBy(wordsAndMetrics, [currentMetric]).reverse().slice(0, 100);
    series.data = best.map(wav => {
        return {tag: wav.word, count: String(wav[currentMetric])}
    });
    series.dataFields.word = "tag";
    series.dataFields.value = "count";
    series.minFontSize = 20;
    series.maxFontSize = 200;

    series.labels.template.url = `${window.location.origin}${window.location.pathname}#path=${path}&fmt=cloud&currentMetric=${currentMetric}&feature={word}`;
    series.labels.template.events.on("hit", () => document.dispatchEvent(new CustomEvent('reload')));

    series.heatRules.push({
        "target": series.labels.template,
        "property": "fill",
        "min": am4core.color("#0000CC"),
        "max": am4core.color("#CC00CC"),
        "dataField": "value"
    });

    series.labels.template.tooltipText = "{word}: {value}";

    const hoverState = series.labels.template.states.create("hover");
    hoverState.properties.fill = am4core.color("#FF0000");

    return chart;
}

export const WordCloud = ({path, currentMetric, wordsAndMetrics}: WordCloudProps) => {
    const [switchOnEditStopwords, setSwitchOnEditStopwords] = useState(false);
    const [chart, setChart] = useState(null as am4plugins_wordCloud.WordCloud);

    useEffect(() => {
        callApi("/api/config", "GET").then(({editStopwords}) => {
            setSwitchOnEditStopwords(editStopwords)
        });
    }, [])

    useEffect(() => {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);

        const paramPath = urlParams.get("swpath");
        const paramWord = urlParams.get("sw");
        if(paramPath && paramWord) {
            callApi("/api/setStopword", "POST", {path: paramPath, word: paramWord}).then(async () => {
                if(chart) {
                    chart.dispose();
                    setChart(null);
                }
                setChart(createCloud(path, switchOnEditStopwords, currentMetric, wordsAndMetrics));
            })
        } else {
            if(chart) {
                chart.dispose();
                setChart(null);
            }
            setChart(createCloud(path, switchOnEditStopwords, currentMetric, wordsAndMetrics));
        }
    }, [path, switchOnEditStopwords, currentMetric])

    return <div id="wordCloud"/>
}
