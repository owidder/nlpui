import * as React from "react"
import * as ReactDOM from "react-dom"

import {getHashParamValue} from "../../util/queryUtil2"
import {SourceDirectory} from "./SourceDirectory"
import {DEFAULT_METRIC} from "./metrics";

import "materialize-css/dist/css/materialize.css"

const path = getHashParamValue("path", ".");
const currentMetric = getHashParamValue("showAttr", DEFAULT_METRIC);

ReactDOM.render(<SourceDirectory path={path} currentMetric={currentMetric} staticFolderCall={false}/>, document.getElementById("container"))