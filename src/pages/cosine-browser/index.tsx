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
const fmt = getHashParamValue("fmt", "list");
const abc = getHashParamValue("abc", "0");
const initialFilter = getHashParamValue("filter", "")

configureGlobalLinksForCosineBrowserPage({currentMetric, feature, path});

ReactDOM.createRoot(document.getElementById("container"))
    .render(<SourceDirectory
        path={path}
        initialCurrentMetric={currentMetric}
        feature={feature}
        initialShowList={fmt == "list"}
        initialFilter={initialFilter}
        initialOrderByAlpha={Number(abc) === 1}
    />)
