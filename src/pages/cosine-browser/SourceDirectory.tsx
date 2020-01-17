import * as React from "react";

import {callApi} from "../../util/fetchUtil";
import {Cosines} from "./Cosines";
import {OnepagerTable} from "./OnepagerTable";
import "./directory.scss";
import {setHashValue} from "../../util/queryUtil2";

const _path = require("path");

interface DirectoryProps {
    path: string
    initialSourceDocument: string
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

export class SourceDirectory extends React.Component<DirectoryProps, DirectoryState> {

    readonly state: DirectoryState = {content: [], currentPath: this.props.path, currentSourceDocument: this.props.initialSourceDocument}

    private async gotoPath(path: string) {
        const pathInfo: PathInfo = await callApi(`src/pathType/${path}`)
        const pathType = pathInfo.pathType

        const folder = (pathType == "file" ? _path.dirname(path) : path)
        const folderInfo: FolderInfo = await callApi(`src/folder/${folder}`)

        this.setState({content: folderInfo.content, currentPath: path, currentPathType: pathType})
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
                  onClick={() => this.gotoPath(path)}>{entry.split(".")[0]}</a>
    }

    showSourceDocument(currentSourceDocument: string) {
        setHashValue("isd", currentSourceDocument)
        this.setState({currentSourceDocument})
    }

    render() {
        const parentFolder = this.parentFolderOfCurrentPath()

        return <div className="directory">
            <h5 className="title">{this.state.currentPath && this.state.currentPath.length > 0 ? this.state.currentPath.split("/").reverse()[0].split(".")[0] : "/"}</h5>
            <div className="margins row">
                <div className="list col-xs-2 col s2">
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
                <div className="col-xs-3 col s3">
                    {this.state.currentPathType == "file" ? <Cosines
                        clickHandler={(docName) => this.showSourceDocument(docName)}
                        document={this.state.currentPath}/> : <span/>}
                </div>
                <div className="col-xs-7 col s7">
                    {this.state.currentSourceDocument ? <OnepagerTable name={this.state.currentSourceDocument}/> : <span/>}
                </div>
            </div>
            </div>
    }
}
