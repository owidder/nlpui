import * as React from "react"
import * as ReactDOM from "react-dom/client"

import {getHashParamValue} from "../../util/queryUtil2"
import {FeatureTable} from "./FeatureTable"

import "materialize-css/dist/css/materialize.css"

const path = getHashParamValue("path", "");

ReactDOM.createRoot(document.getElementById("container")).render(<FeatureTable documentPath={path}/>)
