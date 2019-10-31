import * as React from "react";

import {callApi} from "../../util/fetchUtil";

interface TfidfProps {
    filePath: string
}

interface TermInfo {
    term: string
    tfidfValue: number
}

interface TfidfState {
    termInfos: TermInfo[]
}

interface FileContent {
    path: string
    content: string
}

export class Tfidf extends React.Component<TfidfProps, TfidfState> {

    readonly state: TfidfState = {termInfos: []}

    async readContent() {
        const fileContent: FileContent = await callApi(`file/${this.props.filePath}`)
        const entries = fileContent.content.split("\n")
        const termInfos: TermInfo[] = entries.filter(entry => entry.length > 0).map(entry => {
            const parts = entry.split("\t")
            return {
                term: parts[0],
                tfidfValue: Number(parts[1])
            }
        })
        this.setState({termInfos})
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
        return <div className="list">
            {this.state.termInfos.map(termInfo => <div className="listrow" key={termInfo.term}>
                <div>{termInfo.term}</div>
                <div>{termInfo.tfidfValue}</div>
            </div>)}
        </div>
    }
}
