import * as React from "react"
import * as ReactDOM from "react-dom"

import {getHashParamValue} from "../../util/queryUtil2"
import {FeatureTable} from "./FeatureTable"

import "materialize-css/dist/css/materialize.css"

const path = getHashParamValue("path", "");

ReactDOM.render(<FeatureTable documentPath={path}/>, document.getElementById("container"))
