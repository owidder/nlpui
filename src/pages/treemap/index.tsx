import * as React from "react"
import * as ReactDOM from "react-dom/client"

import {getHashParamValue} from "../../util/queryUtil2"
import {TreemapWithSpinner} from "./TreemapWithSpinner"
import {configureGlobalLinks} from "../../global/globalLinks";

import "materialize-css/dist/css/materialize.css"

const _path = require("path");

const zoomto = getHashParamValue("zoomto", "");
const currentMetric = getHashParamValue("currentMetric", "sum")
const feature = getHashParamValue("feature", "")

configureGlobalLinks({currentMetric, feature, path: _path.dirname(zoomto)});

ReactDOM.createRoot(document.getElementById("container"))
    .render(<TreemapWithSpinner
        zoomto={zoomto}
        width={window.innerWidth}
        height={window.innerHeight}
        currentMetric={currentMetric}
        feature={feature}
    />)
