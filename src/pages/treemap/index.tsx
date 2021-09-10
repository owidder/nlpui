import * as React from "react"
import * as ReactDOM from "react-dom"

import {getHashParamValue} from "../../util/queryUtil2"
import {Treemap} from "./Treemap"

import "materialize-css/dist/css/materialize.css"

const path = getHashParamValue("path", ".");

ReactDOM.render(<Treemap path={path} width={window.innerWidth} height={window.innerHeight}/>, document.getElementById("container"))
