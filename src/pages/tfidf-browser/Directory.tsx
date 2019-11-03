import * as React from "react";

import {callApi} from "../../util/fetchUtil";
import {Tfidf} from "./Tfidf";
import "./directory.scss";

const _path = require("path");

const SRC_BASE_PATH = "https://github.com/frappe/erpnext/tree/c269c68727ffe251c1f04f1bfc373f6ddb1d1b17"
const SUMMARY_FILE_NAME = "_SUMMARY_"

interface DirectoryProps {
    path: string
}

type PathType = "file" | "folder" | "NA"

interface DirectoryState {
    content: string[]
    currentPath: string
    currentPathType?: PathType
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

export class Directory extends React.Component<DirectoryProps, DirectoryState> {

    readonly state: DirectoryState = {content: [], currentPath: this.props.path}

    private async gotoPath(path: string) {
        const pathInfo: PathInfo = await callApi(`pathType/${path}`)
        const pathType = pathInfo.pathType

        const folder = (pathType == "file" ? _path.dirname(path) : path)
        const folderInfo: FolderInfo = await callApi(`folder/${folder}`)

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

    summaryFileOfCurrentPath() {
        return _path.join(this.state.currentPath, SUMMARY_FILE_NAME)
    }

    renderLink(entry: string, path: string) {
        const doHighlight = _path.basename(this.state.currentPath) == entry;
        return <a className={`directoryentry ${doHighlight ? "highlight" : ""}`}
                  href={pathParam(path)}
                  onClick={() => this.gotoPath(path)}>{entry}</a>
    }

    render() {
        console.log("----")
        const parentFolder = this.parentFolderOfCurrentPath()

        return <div className="directory">
            <h5 className="title">{this.state.currentPath && this.state.currentPath.length > 0 ? `/${this.state.currentPath}` : "/"}
            {(this.state.currentPathType == "file" && !this.state.currentPath.endsWith(SUMMARY_FILE_NAME)) ? <a target="_blank" href={`${SRC_BASE_PATH}/${this.state.currentPath}`}>github</a> : <span/>}
            </h5>
            <div className="margins row">
                <div className="list col-xs-6 col s6">
                    {this.renderLink(".", this.state.currentPathType == "file" ? _path.dirname(this.state.currentPath) : this.state.currentPath)}
                    {parentFolder != null ? this.renderLink("..", parentFolder) : <span/>}
                    {this.state.content.filter(entry => entry != SUMMARY_FILE_NAME).map(entry => {
                        const newPath = (this.state.currentPathType == "folder" ?
                            _path.join(this.state.currentPath, entry) :
                            _path.join(_path.dirname(this.state.currentPath), entry))
                        return <div className="listrow" key={entry}>
                            <div>{this.renderLink(entry, newPath)}</div>
                        </div>
                    })}
                </div>
                <div className="col-xs-6 col s6">
                    {this.state.currentPathType == "file" ?
                        <Tfidf filePath={this.state.currentPath}/> :
                        <Tfidf filePath={this.summaryFileOfCurrentPath()}/>}
                </div>
            </div>
            </div>

    }
}
