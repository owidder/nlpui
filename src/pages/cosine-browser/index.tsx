import * as React from "react";
import * as ReactDOM from "react-dom";

import {getHashParamValue} from "../../util/queryUtil2";
import {Directory} from "./Directory";

import "materialize-css/dist/css/materialize.css";

const path = getHashParamValue("path", "");

ReactDOM.render(<Directory path={path}/>, document.getElementById("container"));
