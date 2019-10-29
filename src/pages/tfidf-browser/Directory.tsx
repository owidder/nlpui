import * as React from "react";

interface DirectoryProps {
    path: string
}

interface DirectoryState {
    content: string[]
}

export class Directory extends React.Component<DirectoryProps, DirectoryState> {

    readonly state: DirectoryState = {content: []}

    private readDirectory() {

    }

    async componentDidMount() {
        const content = await fetch(`/api/folder/${this.props.path}`).then(response => response.json())
        this.setState({content})
    }

    render() {
        return <b>{JSON.stringify(this.state.content)}</b>
    }
}
