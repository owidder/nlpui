import * as React from "react"
import * as ReactDOM from "react-dom/client"

import {getHashParamValue} from "../../util/queryUtil2"
import {TreemapWithSpinner} from "./TreemapWithSpinner"

import "materialize-css/dist/css/materialize.css"

const zoomto = getHashParamValue("zoomto", "");
const currentMetric = getHashParamValue("currentMetric", "sum")

document.querySelector(".homelink a").setAttribute("href", "/treemap/treemap.html");

ReactDOM.createRoot(document.getElementById("container")).render(<TreemapWithSpinner zoomto={zoomto} width={window.innerWidth} height={window.innerHeight} currentMetric={currentMetric}/>)
