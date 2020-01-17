import * as React from "react"
import * as ReactDOM from "react-dom"

import {getHashParamValue} from "../../util/queryUtil2"
import {SourceDirectory} from "./SourceDirectory"

import "materialize-css/dist/css/materialize.css"

const path = getHashParamValue("path", "");
const initialSourceDocument = getHashParamValue("isd", undefined)

ReactDOM.render(<SourceDirectory path={path} initialSourceDocument={initialSourceDocument}/>, document.getElementById("container"))