import * as React from "react"
import * as ReactDOM from "react-dom/client"

import {getHashParamValue} from "../../util/queryUtil2"
import {SourceDirectory} from "./SourceDirectory"
import {DEFAULT_METRIC} from "./metrics";

import "materialize-css/dist/css/materialize.css"

const path = getHashParamValue("path", ".");
const currentMetric = getHashParamValue("currentMetric", DEFAULT_METRIC);
const feature = getHashParamValue("feature", "");

ReactDOM.createRoot(document.getElementById("container"))
    .render(<SourceDirectory
        path={path}
        currentMetric={currentMetric}
        staticFolderCall={false}
        feature={feature}
    />)
