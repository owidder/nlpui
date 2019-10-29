import * as React from "react";

import "./directory.scss";

const _path = require("path");

interface DirectoryProps {
    path: string
}

interface DirectoryState {
    content: string[]
    currentPath: string
}

interface FolderInfo {
    folder: string
    content: string[]
}

export class Directory extends React.Component<DirectoryProps, DirectoryState> {

    readonly state: DirectoryState = {content: [], currentPath: this.props.path}

    private async gotoPath(path: string) {
        const folderInfo: FolderInfo = await fetch(`/api/folder/${path}`).then(response => response.json())
        this.setState({content: folderInfo.content, currentPath: path})
    }

    async componentDidMount() {
        this.gotoPath(this.props.path)
    }

    render() {
        return <div className="directory">
            {this.state.content.map(entry => {
                const newPath = _path.join(this.state.currentPath, entry)
                return <a key={entry}
                          href={`#${newPath}`}
                          onClick={() => this.gotoPath(newPath)}>{entry}</a>
            })}
        </div>
    }
}
