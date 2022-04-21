import * as React from "react"
import * as ReactDOM from "react-dom/client"

const _path = require("path");

import {getHashParamValue} from "../../util/queryUtil2"
import {SourceDirectory} from "./SourceDirectory"
import {DEFAULT_METRIC} from "./metrics";

import "materialize-css/dist/css/materialize.css"

const path = getHashParamValue("path", ".");
const currentMetric = getHashParamValue("currentMetric", DEFAULT_METRIC);
const feature = getHashParamValue("feature", "");

document.querySelector(".switchlink a").setAttribute("href", `/treemap/treemap.html#currenMetric=${currentMetric}&feature=${feature}&path=${_path.dirname(path)}`);
document.querySelector(".homelink a").setAttribute("href", `/cosine-browser/cosine-browser.html?rnd=${Math.random().toFixed(5)}#feature=${feature}`);

ReactDOM.createRoot(document.getElementById("container"))
    .render(<SourceDirectory
        path={path}
        currentMetric={currentMetric}
        staticFolderCall={false}
        feature={feature}
    />)
