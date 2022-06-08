import * as React from "react";

import {callApi} from "../../util/fetchUtil";
import {CosinesWithProgress} from "./CosinesWithProgress";
import {WordCloud} from "./WordCloud";
import "../directory.scss";
import {METRICS, WordAndMetrics, MetricValues} from "./metrics";
import {streamContentWithProgress} from "../stream/streamContentWithProgress";
import ClimbingBoxLoader from "react-spinners/ClimbingBoxLoader";
import {css} from "@emotion/react";
import {wordSearchColor} from "../../wordSearch/wordSearchColor";
import {removeAllTooltips} from "../../util/tooltip";
import {configureGlobalLinksForCosineBrowserPage} from "../../global/globalLinks";
import {WordList} from "./WordList";
import {currentLocationWithNewHashValues} from "../../util/queryUtil2";
import {SrcPathLink} from "./SrcPathLink";

const override = css`
  position: absolute;
  top: 50vh;
  left: 50vw;
`;

const _path = require("path");

const NOP = () => {
}

interface DirectoryProps {
    path: string
    initialCurrentMetric: string
    feature?: string
    initialShowList: boolean
    initialOrderByAlpha: boolean
    initialFilter: string
}

type PathType = "file" | "folder" | "NA"

type ValuesForFeature = { [fileOrFolder: string]: number | MetricValues }

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
    valuesForFeature?: ValuesForFeature
    currentMetric: string
    wordsAndMetrics: WordAndMetrics[]
    showList: boolean
    srcPathMap: any
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

export class SourceDirectory extends React.Component<DirectoryProps, DirectoryState> {

    readonly state: DirectoryState = {
        content: [],
        advancedEntries: [],
        currentPath: this.props.path,
        loading: true,
        valuesForFeature: {},
        currentMetric: this.props.initialCurrentMetric,
        wordsAndMetrics: [],
        showList: this.props.initialShowList,
        srcPathMap: {}
    }

    getFmt = () => this.state.showList ? "list" : "cloud";
    getReverseFmt = () => this.state.showList ? "cloud" : "list";

    private async readSrcPathMap() {
        const srcPathMap = await callApi("/api/srcPathMap");
        this.setState({srcPathMap})
    }

    private readValuesForFeature(path: string, feature: string) {
        return new Promise<void>(resolve => {
            streamContentWithProgress(`/api/valuesForFeature?path=${path}&feature=${feature}`, NOP, NOP, NOP,
                (valuesForFeature: ValuesForFeature) => {
                    this.setState({valuesForFeature})
                    resolve()
                })
        })
    }

    private async gotoPath(path: string, withReload?: boolean) {
        if (this.props.feature) {
            await this.readValuesForFeature(path, this.props.feature);
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
                this.setState({wordsAndMetrics})
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

    extractValueForFeature(value: number | MetricValues): [number | undefined, string] {
        if (value) {
            if (typeof value === "number") {
                return [value, `(tf-idf: ${value})`];
            } else {
                const v = value[this.state.currentMetric];
                return [v, `(${this.state.currentMetric}: ${v})`]
            }
        }

        return [undefined, ""]
    }

    renderLink(entry: string, path: string, withSourceLink = true, isFileWithoutVector = false) {
        const maxValue: number = Object.values(this.state.valuesForFeature).reduce<number>((_max, _v) => {
            const value: number = this.extractValueForFeature(_v)[0];
            return value > _max ? value : _max
        }, 0);
        const [value, valueStr] = this.extractValueForFeature(this.state.valuesForFeature[entry]);
        const backgroundColor = wordSearchColor(value, maxValue);
        const doHighlight = _path.basename(this.state.currentPath) == entry;
        return <span style={{backgroundColor}}>
            {withSourceLink ? <SrcPathLink path={path} srcPathMap={this.state.srcPathMap}/> : <span/>}
            {isFileWithoutVector ?
                <span className="directoryentry no-vector">{entry}</span> :
                <a className={`directoryentry ${doHighlight ? "highlight" : ""}`}
                   href={currentLocationWithNewHashValues({path, fmt: this.getFmt()})}
                   onClick={() => this.gotoPath(path, true)}>{entry} <span className="small-value">{valueStr}</span></a>
            }
        </span>
    }

    render() {
        const parentFolder = this.parentFolderOfCurrentPath()

        const gridClass = (width: number) => `col-xs-${width} col s${width}`

        const links = this.state.currentPathType == "folder" ? METRICS.reduce((_links, metric, i) => {
            const href = currentLocationWithNewHashValues({
                currentMetric: metric,
                fmt: this.getFmt(),
                path: this.state.currentPath
            });
            const a = <a onClick={() => {
                configureGlobalLinksForCosineBrowserPage({currentMetric: metric, fmt: this.getFmt()});
                this.setState({currentMetric: metric})
            }} href={href}>{metric}</a>;
            let link = metric == this.state.currentMetric ? <small key={i}><b><u>{a}</u></b></small> :
                <small key={i}><i>{a}</i></small>;
            return [..._links, link]
        }, []) : [];
        return this.state.loading ? <ClimbingBoxLoader color="blue" css={override} loading={true} size={100}/> :
            <div className="directory">
                <div className="featurename">{this.props.feature}</div>
                <h5 className="title">{this.state.currentPath && this.state.currentPath.length > 0 ? this.state.currentPath : "/"} {links}</h5>
                <div className="margins row">
                    <div className={gridClass(2)}>
                        {this.state.currentPathType == "folder" ?
                            <div><a href={currentLocationWithNewHashValues({fmt: this.getFmt()})}
                                    onClick={() => {
                                        configureGlobalLinksForCosineBrowserPage({fmt: this.getReverseFmt()});
                                        this.setState({showList: !this.state.showList})
                                    }}>Show as {this.getReverseFmt()}</a></div> : <span/>
                        }
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
                                {this.state.showList ?
                                    <WordList currentMetric={this.state.currentMetric}
                                              wordsAndMetrics={this.state.wordsAndMetrics}
                                              initialFilter={this.props.initialFilter}
                                              initialOrderByAlpha={this.props.initialOrderByAlpha}/> :
                                    <WordCloud path={this.state.currentPath} currentMetric={this.state.currentMetric}
                                               wordsAndMetrics={this.state.wordsAndMetrics}/>}
                            </div>}
                    </div>
                </div>
            </div>
    }
}
