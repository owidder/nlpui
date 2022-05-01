import * as React from "react"
import * as ReactDOM from "react-dom/client"

import {getHashParamValue} from "../../util/queryUtil2"
import {TreemapWithSpinner} from "./TreemapWithSpinner"
import {configureGlobalLinksForTreemapPage} from "../../global/globalLinks";

import "materialize-css/dist/css/materialize.css"

const zoomto = getHashParamValue("zoomto", "");
const path = getHashParamValue("path", "");
const currentMetric = getHashParamValue("currentMetric", "sum");
const feature = getHashParamValue("feature", "");

configureGlobalLinksForTreemapPage({path: zoomto, feature, currentMetric});

ReactDOM.createRoot(document.getElementById("container"))
    .render(<TreemapWithSpinner
        zoomto={path.length > 0 ? path : zoomto}
        width={window.innerWidth}
        height={window.innerHeight}
        currentMetric={currentMetric}
        feature={feature}
    />)
