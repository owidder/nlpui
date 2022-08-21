import * as React from "react";
import {quantile} from "d3-array";

import {callApi} from "../../util/fetchUtil";
import {CosinesWithProgress} from "./CosinesWithProgress";
import "../directory.scss";
import {METRICS, WordAndMetrics} from "./metrics";
import {streamContentWithProgress} from "../stream/streamContentWithProgress";
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
import {css} from "@emotion/react";
import {wordSearchColor} from "../../wordSearch/wordSearchColor";
import {removeAllTooltips} from "../../util/tooltip";
import {configureGlobalLinksForCosineBrowserPage} from "../../global/globalLinks";
import {WordList} from "./WordList";
import {currentLocationWithNewHashValues} from "../../util/queryUtil2";
import {SrcPathLink} from "./SrcPathLink";
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

const _path = require("path");

const NOP = () => {
}

interface DirectoryProps {
    path: string
    initialCurrentMetric: string
    feature?: string
    fullWord?: string
    initialFmt: string
    initialOrderByAlpha: boolean
    initialFilter: string
    initialLengthWeightened: boolean
    initialUseWeightedTfIdf: boolean
}

type PathType = "file" | "folder" | "NA"

type CountsForFeature = { [fileOrFolder: string]: number }

interface AdvancedEntry {
    name: string
    type: PathType
    hasVector?: boolean
}

interface DirectoryState {
    content: string[]
    advancedEntries: AdvancedEntry[]
    currentPath: string
    currentPathType?: PathType
    tree?: any
    loading: boolean
    wait: boolean
    countsForFeature?: CountsForFeature
    currentMetric: string
    wordsAndMetrics: WordAndMetrics[]
    fmt: string
    srcPathMap: any
    useWeightedTfIdf: boolean
}

interface FolderInfo {
    folder: string
    content: string[]
    advancedEntries: AdvancedEntry[]
}

interface PathInfo {
    path: string
    pathType: PathType
}

const extendMetrics = (values: WordAndMetrics, maxCount = 100): WordAndMetrics => {
    const factor = Math.min(values.count[0], maxCount);
    return {...values,
        avgMax: values.avg ? [values.avg[0] * factor, values.avg[1] * factor] : undefined,
        maxMax: values.max ? [values.max[0] * factor, values.max[1] * factor] : undefined
    }
}

export class SourceDirectory extends React.Component<DirectoryProps, DirectoryState> {

    readonly state: DirectoryState = {
        content: [],
        advancedEntries: [],
        currentPath: this.props.path,
        loading: true,
        wait: false,
        countsForFeature: {},
        currentMetric: this.props.initialCurrentMetric,
        wordsAndMetrics: [],
        fmt: this.props.initialFmt,
        srcPathMap: {},
        useWeightedTfIdf: false
    }

    private async readSrcPathMap() {
        const srcPathMap = await callApi("/api/srcPathMap");
        this.setState({srcPathMap})
    }

    private readCountsForFeature(path: string, feature: string) {
        return new Promise<void>(resolve => {
            streamContentWithProgress(`/api/countsForFeature?path=${path}&feature=${feature}`, NOP, NOP, NOP,
                (countsForFeature: CountsForFeature) => {
                    this.setState({countsForFeature})
                    resolve()
                })
        })
    }

    private async gotoPath(path: string, withReload?: boolean) {
        this.setState({wait: true});
        if (this.props.feature) {
            this.readCountsForFeature(path, this.props.feature);
        }
        const pathInfo: PathInfo = await callApi(`/api/src/pathType/${path}`)
        const pathType = pathInfo.pathType
        configureGlobalLinksForCosineBrowserPage({path: pathType == "file" ? _path.dirname(path) : path});

        if (pathType === "file" && withReload) {
            location.reload();
        } else {
            const folder = (pathType == "file" ? _path.dirname(path) : path)
            const folderInfo: FolderInfo = await callApi(`/api/src/folder2/${folder}`)
            if (pathType == "folder") {
                const wordsAndMetrics: WordAndMetrics[] = await callApi(`/api/agg/folder/${path}`);
                const p95 = quantile(wordsAndMetrics.map(wam => wam.count[0]), .95);
                console.log(`p95: ${p95}`);
                const extendedWordsAndMetrics: WordAndMetrics[] = wordsAndMetrics.map(wam => {
                    return extendMetrics(wam, p95) as WordAndMetrics;
                })
                this.setState({wordsAndMetrics: extendedWordsAndMetrics})
            }

            removeAllTooltips();
            this.setState({
                content: folderInfo.content,
                advancedEntries: folderInfo.advancedEntries,
                currentPath: path,
                currentPathType: pathType,
                loading: false
            })
        }

        this.setState({wait: false})
    }

    async componentDidMount() {
        await this.readSrcPathMap();
        this.gotoPath(this.props.path)
    }

    currentFolderWithoutTrailingSlash(): string {
        const currentFolder = this.state.currentPathType == "folder" ? this.state.currentPath : _path.dirname(this.state.currentPath)

        return currentFolder.endsWith("/") ? currentFolder.substr(0, currentFolder.length - 1) : currentFolder
    }

    parentFolderOfCurrentPath(): string {
        const currentFolder = this.currentFolderWithoutTrailingSlash()
        if (currentFolder.length > 0 && currentFolder != ".") {
            const parts = currentFolder.split("/")
            return parts.slice(0, parts.length - 1).join("/")
        }

        return null
    }

    renderLinkWithDiv(entry: string, path: string, withSourceLink = true, isFileWithoutVector = false) {
        return <div className="listrow" key={path + entry}>
            <div>{this.renderLink(entry, path, withSourceLink, isFileWithoutVector)}</div>
        </div>
    }

    renderLink(entry: string, path: string, withSourceLink = true, isFileWithoutVector = false) {
        const maxValue: number = Object.values(this.state.countsForFeature).reduce<number>((_max, _v) => _v[0] > _max ? _v[0] : _max, 0);
        const value: number = this.state.countsForFeature[entry] ? this.state.countsForFeature[entry][0] : undefined;
        const backgroundColor = wordSearchColor(value, maxValue);
        const doHighlight = _path.basename(this.state.currentPath) == entry;
        return <span style={{backgroundColor}}>
            {withSourceLink ? <SrcPathLink path={path} srcPathMap={this.state.srcPathMap}/> : <span/>}
            {isFileWithoutVector ?
                <span className="directoryentry no-vector">{entry}</span> :
                <a className={`directoryentry ${doHighlight ? "highlight" : ""}`}
                   href={currentLocationWithNewHashValues({path, fmt: this.state.fmt})}
                   onClick={() => this.gotoPath(path, true)}>{entry} <span className="small-value">{value > 0 ? `[${value}]` : ""}</span></a>
            }
        </span>
    }

    switchTfIdfWeights() {

    }

    private loaders = [
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

    render() {
        const parentFolder = this.parentFolderOfCurrentPath()

        const gridClass = (width: number) => `col-xs-${width} col s${width}`

        const links = this.state.currentPathType == "folder" ? METRICS.reduce((_links, metric, i) => {
            const href = currentLocationWithNewHashValues({
                currentMetric: metric,
                fmt: this.state.fmt,
                path: this.state.currentPath
            });
            const a = <a onClick={() => {
                configureGlobalLinksForCosineBrowserPage({currentMetric: metric, fmt: this.state.fmt});
                this.setState({currentMetric: metric})
            }} href={href}>{metric}</a>;
            let link = metric == this.state.currentMetric ? <small key={i}><b><u>{a}</u></b></small> :
                <small key={i}><i>{a}</i></small>;
            return [..._links, link]
        }, []) : [];
        return this.state.loading ? this.loaders[randomNumberBetween(0, this.loaders.length-1)] :
            <div className="directory">
                <div className="featurename">{this.props.fullWord ? `${this.props.feature} (${this.props.fullWord})` : this.props.feature}</div>
                <h5 className="title">{this.state.currentPath && this.state.currentPath.length > 0 ? this.state.currentPath : "/"} {links}</h5>
                <div className="margins row">
                    <div className={gridClass(2)}>
                        {this.props.feature && this.state.currentPathType === "folder" ?
                            <div><a href={currentLocationWithNewHashValues({fmt: this.state.fmt == "wordlist" ? "wordlist" : "search"})}
                                    onClick={() => {
                                        this.setState({fmt: this.state.fmt == "wordlist" ? "search" : "wordlist"})
                                    }}>Show {this.state.fmt == "wordlist" ? "search" : "words"}</a></div> : <span/>
                        }
                        {parentFolder != null ? this.renderLinkWithDiv("<root>", "", false) : <span/>}
                        {this.renderLinkWithDiv(".", this.state.currentPathType == "file" ? _path.dirname(this.state.currentPath) : this.state.currentPath, false)}
                        {parentFolder != null ? this.renderLinkWithDiv("..", parentFolder, false) : <span/>}
                        {this.state.advancedEntries.map(advancedEntry => {
                            const newPath = (this.state.currentPathType == "folder" ?
                                _path.join(this.state.currentPath, advancedEntry.name) :
                                _path.join(_path.dirname(this.state.currentPath), advancedEntry.name))
                            return this.renderLinkWithDiv(advancedEntry.name, newPath, true, (advancedEntry.type == "file" && !advancedEntry.hasVector))
                        })}
                    </div>
                    <div className={gridClass(10)}>
                        {this.state.currentPathType == "file" ? <CosinesWithProgress
                                doc={this.state.currentPath}
                                feature={this.props.feature}
                                srcPathMap={this.state.srcPathMap}
                            /> :
                            <div>
                                {this.props.feature && this.state.fmt == "search" ?
                                    <CosinesWithProgress
                                        doc={this.state.currentPath}
                                        searchStem={this.props.feature}
                                        searchFullWord={this.props.fullWord}
                                        feature={this.props.feature}
                                        srcPathMap={this.state.srcPathMap}
                                    /> :
                                    <WordList currentMetric={this.state.currentMetric}
                                              wordsAndMetrics={this.state.wordsAndMetrics}
                                              initialFilter={this.props.initialFilter}
                                              initialLengthWeightened={this.props.initialLengthWeightened}
                                              initialUseWeightedTfIdf={this.props.initialUseWeightedTfIdf}
                                              initialOrderByAlpha={this.props.initialOrderByAlpha}/>
                                }
                            </div>}
                    </div>
                </div>
                {this.state.wait ?
                    <span>
                        <div style={glasspane_style}/>
                        {this.loaders[randomNumberBetween(0, this.loaders.length-1)]}
                    </span> :
                    <span/>}
            </div>
    }
}
