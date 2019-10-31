import * as React from "react";

import {callApi} from "../../util/fetchUtil";
import {Tfidf} from "./Tfidf";
import "./directory.scss";

const _path = require("path");

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

    renderLink(entry: string, path: string) {
        return <a key={entry}
                  href={pathParam(path)}
                  onClick={() => this.gotoPath(path)}>{entry}</a>
    }

    render() {
        const parentFolder = this.parentFolderOfCurrentPath()

        return <div className="ml row">
            <div className="directory col-xs-6 col s6">
                {parentFolder != null ? this.renderLink("..", parentFolder) : <span/>}
                {this.state.content.map(entry => {
                    const newPath = (this.state.currentPathType == "folder" ?
                        _path.join(this.state.currentPath, entry) :
                        _path.join(_path.dirname(this.state.currentPath), entry))
                    return this.renderLink(entry, newPath)
                })}
            </div>
            <div className="col-xs-6 col s6">
                {this.state.currentPathType == "file" ? <Tfidf filePath={this.state.currentPath}/> : <span/>}
            </div>
            </div>
    }
}
