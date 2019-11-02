import * as React from "react";

import {callApi} from "../../util/fetchUtil";

interface TfidfProps {
    filePath: string
}

interface TermInfo {
    term: string
    tfidfValue?: number
    plusOrMinus?: "+" | "-" | "?"
}

interface TfidfState {
    termInfos: TermInfo[]
}

interface FileContent {
    path: string
    content: string
}

const readPlusOrMinusRecursive = async (termInfos: TermInfo[], termInfosWithPlusOrMinus: TermInfo[], index: number, resolve: (newTermInfos: TermInfo[]) => void) => {
    if(index < termInfos.length) {
        const currentTermInfo = termInfos[index]
        const termInfo: TermInfo = await callApi(`termInfo/${currentTermInfo.term}`)
        termInfosWithPlusOrMinus.push({...currentTermInfo, plusOrMinus: termInfo.plusOrMinus})
        readPlusOrMinusRecursive(termInfos, termInfosWithPlusOrMinus, index+1, resolve)
    } else {
        resolve(termInfosWithPlusOrMinus)
    }
}

export class Tfidf extends React.Component<TfidfProps, TfidfState> {

    readonly state: TfidfState = {termInfos: []}

    setPlusOrMinus(termInfos: TermInfo[]): Promise<TermInfo[]> {
        return new Promise(resolve => {
            readPlusOrMinusRecursive(termInfos, [], 0, resolve)
        })
    }

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
        const termInfosWithPlusOrMinus = await this.setPlusOrMinus(termInfos)
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
