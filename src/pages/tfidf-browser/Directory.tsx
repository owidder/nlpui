import * as React from "react";

interface DirectoryProps {
    path: string
}

interface DirectoryState {
    content: string[]
}

export class Directory extends React.Component<DirectoryProps, DirectoryState> {

    readonly state: DirectoryState = {content: []}

    render() {
        return <b>{this.props.path}</b>
    }
}