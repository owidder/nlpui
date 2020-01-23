import * as React from "react"

import {callApi} from "../../util/fetchUtil"
import {Words} from "./Words"
import {OnepagerTable} from "../cosine-browser/OnepagerTable"

import "./directory.scss"
import "../styles.scss"

const _path = require("path");

interface DirectoryProps {
    path: string
}

type PathType = "file" | "folder" | "NA"

interface DirectoryState {
    content: string[]
    currentPath: string
    currentPathType?: PathType
    currentSourceDocument?: string
}

interface FolderInfo {
    folder: string
    content: string[]
}

interface PathInfo {
    path: string
    pathType: PathType
}

const pathParam = (path: string) => {
    return `#path=${path}`
}

export class WordDirectory extends React.Component<DirectoryProps, DirectoryState> {

    readonly state: DirectoryState = {content: [], currentPath: this.props.path}

    private async gotoPath(path: string) {
        const pathInfo: PathInfo = await callApi(`src/pathType/${path}`)
        const pathType = pathInfo.pathType

        const folder = (pathType == "file" ? _path.dirname(path) : path)
        const folderInfo: FolderInfo = await callApi(`words/folder/${folder}`)

        this.setState({content: folderInfo.content, currentPath: path, currentPathType: pathType})
        if(pathType == "file") {
            const docName = path ? path.split("/")[1].split(".")[0] : undefined
            this.setState({currentSourceDocument: docName})
        } else {
            this.setState({currentSourceDocument: undefined})
        }
    }

    async componentDidMount() {
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

    renderLink(entry: string, path: string) {
        const doHighlight = _path.basename(this.state.currentPath) == entry;
        return <a className={`directoryentry ${doHighlight ? "highlight" : ""}`}
                  href={pathParam(path)}
                  onClick={() => this.gotoPath(path)}>{entry.endsWith(".txt") ? entry.split(".txt")[0] : entry}</a>
    }

    render() {
        console.log("----")
        const parentFolder = this.parentFolderOfCurrentPath()

        const gridClass = (width: number) => `col-xs-${width} col s${width}`

        return <div className="directory">
            <h5 className="title">{this.state.currentPath && this.state.currentPath.length > 0 ? `/${this.state.currentPath}` : "/"}</h5>
            <div className="margins row">
                <div className={`list ${gridClass(4)}`}>
                    {this.renderLink(".", this.state.currentPathType == "file" ? _path.dirname(this.state.currentPath) : this.state.currentPath)}
                    {parentFolder != null ? this.renderLink("..", parentFolder) : <span/>}
                    {this.state.content.map(entry => {
                        const newPath = (this.state.currentPathType == "folder" ?
                            _path.join(this.state.currentPath, entry) :
                            _path.join(_path.dirname(this.state.currentPath), entry))
                        return <div className="listrow" key={entry}>
                            <div>{this.renderLink(entry, newPath)}</div>
                        </div>
                    })}
                </div>
                <div className={gridClass(4)}>
                    {this.state.currentPathType == "file" ? <Words filePath={this.state.currentPath}/> : <span/>}
                </div>
                <div className={gridClass(4)}>
                    {this.state.currentSourceDocument ? <OnepagerTable
                        withWordCounts={false}
                        name={this.state.currentSourceDocument}/> : <span/>}
                </div>
            </div>
            </div>
    }
}
