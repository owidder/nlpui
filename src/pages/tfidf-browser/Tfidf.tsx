import * as React from "react";

interface TfidfProps {
    filePath: string
}

export class Tfidf extends React.Component<TfidfProps> {

    render() {
        return <div>{this.props.filePath}</div>
    }
}