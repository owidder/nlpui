import * as React from "react";

import {callApi} from "../../util/fetchUtil";

interface TfidfProps {
    filePath: string
}

interface TfidfState {
    content: string;
}

export class Tfidf extends React.Component<TfidfProps, TfidfState> {

    readonly state: TfidfState = {content: ""}

    async readContent() {
        const content = await callApi(`file/${this.props.filePath}`)
        this.setState({content: JSON.stringify(content)})
    }

    componentDidMount(): void {
        this.readContent()
    }

    componentDidUpdate(prevProps: Readonly<TfidfProps>): void {
        if(prevProps.filePath != this.props.filePath) {
            this.readContent()
        }
    }

    render() {
        return <div>{this.state.content}</div>
    }
}
