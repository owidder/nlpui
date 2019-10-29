import * as React from "react";

import "./directory.scss";

interface DirectoryProps {
    path: string
}

interface DirectoryState {
    content: string[]
    currentPath: string
}

interface FolderInfo {
    folder: string;
    content: string[];
}

export class Directory extends React.Component<DirectoryProps, DirectoryState> {

    readonly state: DirectoryState = {content: [], currentPath: this.props.path}

    private async readDirectory(): Promise<string[]> {
        const folderInfo: FolderInfo = await fetch(`/api/folder/${this.state.currentPath}`).then(response => response.json())
        return folderInfo.content
    }

    async componentDidMount() {
        this.setState({content: await this.readDirectory()})
    }

    render() {
        return <div className="directory">
            {this.state.content.map((entry, i) => <div key={i}>{entry}</div>)}
        </div>
    }
}
