import * as React from "react";

import {callApi} from "../../util/fetchUtil";
import {CosinesWithProgress} from "./CosinesWithProgress";
import {WordCloud} from "./WordCloud";
import "../directory.scss";
import {METRICS} from "./metrics";
import {streamContentWithProgress} from "../stream/streamContentWithProgress";
import ClimbingBoxLoader from "react-spinners/ClimbingBoxLoader";
import { css } from "@emotion/react";
import {wordSearchColor} from "../../wordSearch/wordSearchColor";

const override = css`
  position: absolute;
  top: 50vh;
  left: 50vw;
`;

const _path = require("path");

const NOP = () => {}

interface DirectoryProps {
    path: string
    currentMetric: string
    staticFolderCall?: boolean
    staticFileCall?: boolean
}

type PathType = "file" | "folder" | "NA"

type ValuesForFeature = {[fileOrFolder: string]: number}

interface DirectoryState {
    content: string[]
    currentPath: string
    currentPathType?: PathType
    tree?: any
    loading: boolean
    values?: ValuesForFeature
}

interface FolderInfo {
    folder: string
    content: string[]
}

interface PathInfo {
    path: string
    pathType: PathType
}

const lastPartOfPath = (path: string) => {
    const parts = path.split("/")
    return parts[parts.length-1]
}

export class SourceDirectory extends React.Component<DirectoryProps, DirectoryState> {

    readonly state: DirectoryState = {content: [], currentPath: this.props.path, loading: true, values: {}}

    private readValuesForFeature(path: string, feature: string) {
        return new Promise(resolve => {
            streamContentWithProgress(`/api/valuesForFeature?path=${path}&feature=${feature}`, NOP, NOP, NOP,
                (values: ValuesForFeature) => {
                    this.setState({values})
                    resolve()
                })
        })
    }

    private async gotoPath(path: string, withReload?: boolean) {
        const pathInfo: PathInfo = await callApi(`/api/src/pathType/${path}`)
        const pathType = pathInfo.pathType

        if(pathType === "file" && withReload) {
            location.reload();
        } else {
            const folder = (pathType == "file" ? _path.dirname(path) : path)
            const folderUrl = this.props.staticFolderCall ? `src/folder/${folder}/${lastPartOfPath(folder)}.json` : `/api/src/folder2/${folder}`
            const folderInfo: FolderInfo = await callApi(folderUrl)

            if(pathType == "folder") {
                await new Promise(resolve => {
                    const treeLoaded = (tree: any) => {
                        this.setState({tree});
                        resolve()
                    }
                    streamContentWithProgress(`/api/subAgg/folder/${path}`,
                        () => {}, () => {}, () => {}, treeLoaded);
                })
            }

            this.setState({content: folderInfo.content, currentPath: path, currentPathType: pathType, loading: false})
        }
    }

    async componentDidMount() {
        this.readValuesForFeature(this.props.path, "Employee")
        this.gotoPath(this.props.path)
    }

    currentFolderWithoutTrailingSlash(): string {
        const currentFolder = this.state.currentPathType == "folder" ? this.state.currentPath : _path.dirname(this.state.currentPath)

        return currentFolder.endsWith("/") ? currentFolder.substr(0, currentFolder.length-1) : currentFolder
    }

    parentFolderOfCurrentPath(): string {
        const currentFolder = this.currentFolderWithoutTrailingSlash()
        if(currentFolder.length > 0 && currentFolder != ".") {
            const parts = currentFolder.split("/")
            return parts.slice(0, parts.length-1).join("/")
        }

        return null
    }

    renderLinkWithDiv(entry: string, path: string) {
        return <div className="listrow" key={path + entry}>
            <div>{this.renderLink(entry, path)}</div>
        </div>
    }

    renderLink(entry: string, path: string) {
        const maxValue: number = Object.values(this.state.values).reduce((_max, _v) => _v > _max ? _v : _max, 0);
        const backgroundColor = this.state.values[entry] > 0 ? wordSearchColor(this.state.values[entry], maxValue) : "white";
        const doHighlight = _path.basename(this.state.currentPath) == entry;
        return <a className={`directoryentry ${doHighlight ? "highlight" : ""}`} style={{backgroundColor}}
                  href={`#path=${path}&currentMetric=${this.props.currentMetric}`}
                  onClick={() => this.gotoPath(path, true)}>{entry}</a>
    }

    render() {
        const parentFolder = this.parentFolderOfCurrentPath()

        const gridClass = (width: number) => `col-xs-${width} col s${width}`

        const links = this.state.currentPathType == "folder" ? METRICS.reduce((_links, metric, i) => {
            const href = `/cosine-browser/cosine-browser.html#path=${this.state.currentPath}&currentMetric=${metric}`;
            const onclick = () => setTimeout(() => window.location.reload(), 100);
            const a = <a onClick={onclick} href={href}>{metric}</a>;
            let link = metric == this.props.currentMetric ? <small key={i}><b><u>{a}</u></b></small> : <small key={i}><i>{a}</i></small>;
            return [..._links, link]
        }, []) : [];
        return this.state.loading ? <ClimbingBoxLoader color="blue" css={override} loading={true} size={100}/> :
        <div className="directory">
            <h5 className="title">{this.state.currentPath && this.state.currentPath.length > 0 ? this.state.currentPath : "/"} {links}</h5>
            <div className="margins row">
                <div className={gridClass(2)}>
                    {this.renderLinkWithDiv(".", this.state.currentPathType == "file" ? _path.dirname(this.state.currentPath) : this.state.currentPath)}
                    {parentFolder != null ? this.renderLinkWithDiv("..", parentFolder) : <span/>}
                    {this.state.content.map(entry => {
                        const newPath = (this.state.currentPathType == "folder" ?
                            _path.join(this.state.currentPath, entry) :
                            _path.join(_path.dirname(this.state.currentPath), entry))
                        return this.renderLinkWithDiv(entry, newPath)
                    })}
                </div>
                <div className={gridClass(10)}>
                    {this.state.currentPathType == "file" ? <CosinesWithProgress
                        doc={this.state.currentPath}
                    /> : <WordCloud path={this.state.currentPath} currentMetric={this.props.currentMetric}/>}
                </div>
            </div>
            </div>
    }
}
