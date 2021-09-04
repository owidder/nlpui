import * as React from "react"
import * as ReactDOM from "react-dom"

import {getHashParamValue} from "../../util/queryUtil2"
import {Progress} from "./Progress"

import "materialize-css/dist/css/materialize.css"

const max = getHashParamValue("max", "10");

ReactDOM.render(<Progress max={Number(max)}/>, document.getElementById("container"))
