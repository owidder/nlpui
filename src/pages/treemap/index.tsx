import * as React from "react"
import * as ReactDOM from "react-dom"

import {getHashParamValue} from "../../util/queryUtil2"
import {TreemapWithProgress} from "./TreemapWithProgress"

import "materialize-css/dist/css/materialize.css"

const zoomto = getHashParamValue("zoomto", "");

document.querySelector(".homelink a").setAttribute("href", "/treemap/treemap.html");

ReactDOM.render(<TreemapWithProgress zoomto={zoomto} width={window.innerWidth} height={window.innerHeight}/>, document.getElementById("container"))
