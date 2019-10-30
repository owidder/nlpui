import * as React from "react";

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
    isFileOrFolder: PathType
}

const callApi = async (apiPath: string) => {
    return await fetch(`/api/${apiPath}`).then(response => response.json())
}

export class Directory extends React.Component<DirectoryProps, DirectoryState> {

    readonly state: DirectoryState = {content: [], currentPath: this.props.path}

    private async gotoPath(path: string) {
        const pathInfo: PathInfo = await callApi(`/isFileOrFolder/${path}`)
        const pathType = pathInfo.isFileOrFolder

        const folder = (pathType == "file" ? _path.dirname(path) : path)
        const folderInfo: FolderInfo = await callApi(`/folder/${folder}`)

        this.setState({content: folderInfo.content, currentPath: path, currentPathType: pathType})
    }

    async componentDidMount() {
        this.gotoPath(this.props.path)
    }

    render() {
        console.log(this.state.currentPathType)
        console.log(this.state.currentPath)
        return <div className="directory">
            {this.state.content.map(entry => {
                const newPath = (this.state.currentPathType == "folder" ?
                    _path.join(this.state.currentPath, entry) :
                    _path.join(_path.dirname(this.state.currentPath), entry))
                return <a key={entry}
                          href={`#${newPath}`}
                          onClick={() => this.gotoPath(newPath)}>{entry}</a>
            })}
        </div>
    }
}
