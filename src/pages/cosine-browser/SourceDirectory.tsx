import * as React from "react";

import {callApi} from "../../util/fetchUtil";
import {CosinesWithProgress} from "./CosinesWithProgress";
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
    fullWord?: string
    initialFmt: string
    initialOrderByAlpha: boolean
    initialFilter: string
    initialLengthWeightened: boolean
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
    fmt: string
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

const extendMetrics = (values: MetricValues | WordAndMetrics): MetricValues | WordAndMetrics => {
    const factor = Math.min(values.count, 100);
    return {...values, avgMax: values.avg * factor, maxMax: values.max * factor}
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
        fmt: this.props.initialFmt,
        srcPathMap: {}
    }

    private async readSrcPathMap() {
        const srcPathMap = await callApi("/api/srcPathMap");
        this.setState({srcPathMap})
    }

    private readValuesForFeature(path: string, feature: string) {
        return new Promise<void>(resolve => {
            streamContentWithProgress(`/api/valuesForFeature?path=${path}&feature=${feature}`, NOP, NOP, NOP,
                (valuesForFeature: ValuesForFeature) => {
                    const extendedValuesForFeature: ValuesForFeature = Object.keys(valuesForFeature).reduce<ValuesForFeature>((_extendedValuesForFeature, fileOrFolder) => {
                        const metricValues: number | MetricValues = valuesForFeature[fileOrFolder];
                        if(typeof metricValues == "number") {
                            return {..._extendedValuesForFeature, [fileOrFolder]: metricValues}
                        } else {
                            return {..._extendedValuesForFeature, [fileOrFolder]: extendMetrics(metricValues)}
                        }
                    }, {})
                    this.setState({valuesForFeature: extendedValuesForFeature})
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
                const extendedWordsAndMetrics: WordAndMetrics[] = wordsAndMetrics.map(wam => {
                    return extendMetrics(wam) as WordAndMetrics;
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
                return [value, `(tf-idf of "${this.props.feature}": ${value.toFixed(2)})`];
            } else {
                const v = value[this.state.currentMetric];
                return [v, `(${this.state.currentMetric} of "${this.props.feature}": ${v % 1 != 0 ? v.toFixed(2) : v.toFixed(0)})`]
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
                   href={currentLocationWithNewHashValues({path, fmt: this.state.fmt})}
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
        return this.state.loading ? <ClimbingBoxLoader color="blue" css={override} loading={true} size={100}/> :
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
                                              initialOrderByAlpha={this.props.initialOrderByAlpha}/>
                                }
                            </div>}
                    </div>
                </div>
            </div>
    }
}
