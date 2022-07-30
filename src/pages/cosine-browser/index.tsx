import * as React from "react"
import * as ReactDOM from "react-dom/client"

import {getHashParamValue} from "../../util/queryUtil2"
import {SourceDirectory} from "./SourceDirectory"
import {DEFAULT_METRIC} from "./metrics";
import {configureGlobalLinksForCosineBrowserPage} from "../../global/globalLinks";

import "materialize-css/dist/css/materialize.css"

const path = getHashParamValue("path", ".");
const currentMetric = getHashParamValue("currentMetric", DEFAULT_METRIC);
const feature = getHashParamValue("feature", "");
const fullWord = getHashParamValue("fullword", "");
const fmt = getHashParamValue("fmt", "wordlist");
const abc = getHashParamValue("abc", "0");
const lw = getHashParamValue("lw", "0");
const tfw = getHashParamValue("tfw", "0");
const initialFilter = getHashParamValue("filter", "")
const maxCount = getHashParamValue("mc", "100")

configureGlobalLinksForCosineBrowserPage({currentMetric, feature, path});

ReactDOM.createRoot(document.getElementById("container"))
    .render(<SourceDirectory
        path={path}
        initialCurrentMetric={currentMetric}
        feature={feature}
        fullWord={fullWord}
        initialFmt={fmt}
        initialFilter={initialFilter}
        initialOrderByAlpha={Number(abc) === 1}
        initialUseWeightedTfIdf={Number(tfw) === 1}
        initialLengthWeightened={Number(lw) === 1}
        maxCount={Number(maxCount)}
    />)
