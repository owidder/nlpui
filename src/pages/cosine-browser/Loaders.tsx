import * as React from "react";
import {css} from "@emotion/react";
import ClockLoader from "react-spinners/ClockLoader";
import BarLoader from "react-spinners/BarLoader";
import BeatLoader from "react-spinners/BeatLoader";
import BounceLoader from "react-spinners/BounceLoader";
import CircleLoader from "react-spinners/CircleLoader";
import ClimbingBoxLoader from "react-spinners/ClimbingBoxLoader";
import ClipLoader from "react-spinners/ClipLoader";
import DotLoader from "react-spinners/DotLoader";
import FadeLoader from "react-spinners/FadeLoader";
import GridLoader from "react-spinners/GridLoader";
import HashLoader from "react-spinners/HashLoader";
import MoonLoader from "react-spinners/MoonLoader";
import PacmanLoader from "react-spinners/PacmanLoader";
import PuffLoader from "react-spinners/PuffLoader";
import PulseLoader from "react-spinners/PulseLoader";
import RingLoader from "react-spinners/RingLoader";
import RiseLoader from "react-spinners/RiseLoader";
import RotateLoader from "react-spinners/RotateLoader";
import ScaleLoader from "react-spinners/ScaleLoader";
import SkewLoader from "react-spinners/SkewLoader";
import SquareLoader from "react-spinners/SquareLoader";
import SyncLoader from "react-spinners/SyncLoader";
import {PropagateLoader} from "react-spinners";
import {randomNumberBetween} from "../../util/miscUtil";

const loader_override = css`
  position: absolute;
  top: 50vh;
  left: 50vw;
`;

const glasspane_style: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(255, 255, 255, .5)",
    backdropFilter: "blur(5px)",
}

const loaders = [
    <BarLoader color="blue" css={loader_override} loading={true}/>,
    <BeatLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <BounceLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <CircleLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <ClimbingBoxLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <ClipLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <ClockLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <DotLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <FadeLoader color="blue" css={loader_override} loading={true}/>,
    <GridLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <HashLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <MoonLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <PacmanLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <PropagateLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <PuffLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <PulseLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <RingLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <RiseLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <RotateLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <ScaleLoader color="blue" css={loader_override} loading={true}/>,
    <SkewLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <SquareLoader color="blue" css={loader_override} loading={true} size={100}/>,
    <SyncLoader color="blue" css={loader_override} loading={true} size={100}/>,
]

export const GlassPane = () => <div style={glasspane_style}/>

export const RandomLoader = () => loaders[randomNumberBetween(0, loaders.length-1)]
