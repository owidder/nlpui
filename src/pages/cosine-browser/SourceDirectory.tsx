import * as React from "react";

import {callApi} from "../../util/fetchUtil";
import {CosinesWithProgress} from "./CosinesWithProgress";
import {WordCloud} from "./WordCloud";
import "../directory.scss";

const _path = require("path");

interface DirectoryProps {
    path: string
    staticFolderCall?: boolean
    staticFileCall?: boolean
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

const lastPartOfPath = (path: string) => {
    const parts = path.split("/")
    return parts[parts.length-1]
}

export class SourceDirectory extends React.Component<DirectoryProps, DirectoryState> {

    readonly state: DirectoryState = {content: [], currentPath: this.props.path}

    private async gotoPath(path: string, withReload?: boolean) {
        const pathInfo: PathInfo = await callApi(`/api/src/pathType/${path}`)
        const pathType = pathInfo.pathType

        if(pathType === "file" && withReload) {
            location.reload();
        } else {
            const folder = (pathType == "file" ? _path.dirname(path) : path)
            const folderUrl = this.props.staticFolderCall ? `src/folder/${folder}/${lastPartOfPath(folder)}.json` : `/api/src/folder2/${folder}`
            const folderInfo: FolderInfo = await callApi(folderUrl)

            this.setState({content: folderInfo.content, currentPath: path, currentPathType: pathType})
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

    renderLinkWithDiv(entry: string, path: string) {
        return <div className="listrow" key={path + entry}>
            <div>{this.renderLink(entry, path)}</div>
        </div>
    }

    renderLink(entry: string, path: string) {
        const doHighlight = _path.basename(this.state.currentPath) == entry;
        return <a className={`directoryentry ${doHighlight ? "highlight" : ""}`}
                  href={pathParam(path)}
                  onClick={() => this.gotoPath(path, true)}>{entry}</a>
    }

    render() {
        const parentFolder = this.parentFolderOfCurrentPath()

        const gridClass = (width: number) => `col-xs-${width} col s${width}`

        return <div className="directory">
            <h5 className="title">{this.state.currentPath && this.state.currentPath.length > 0 ? this.state.currentPath : "/"}</h5>
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
                    /> : <WordCloud path={this.state.currentPath}/>}
                </div>
            </div>
            </div>
    }
}
