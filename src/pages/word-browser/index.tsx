import * as React from "react";
import * as ReactDOM from "react-dom";

import {getHashParamValue} from "../../util/queryUtil2";
import {WordDirectory} from "./Directory";

import "materialize-css/dist/css/materialize.css";

const path = getHashParamValue("path", "");

ReactDOM.render(<WordDirectory path={path}/>, document.getElementById("container"));
