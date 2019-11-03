import * as React from "react";

import {callApi} from "../../util/fetchUtil";

interface TfidfProps {
    filePath: string
}

type PlusMinus = "+" | "-" | "?"

interface TermInfo {
    term: string
    tfidfValue?: number
    plusOrMinus?: PlusMinus
}

interface TfidfState {
    termInfos: TermInfo[]
    showMinus: boolean
}

interface FileContent {
    path: string
    terms: TermInfo[]
}

export class Tfidf extends React.Component<TfidfProps, TfidfState> {

    readonly state: TfidfState = {termInfos: [], showMinus: true}

    async readContent() {
        const fileContent: FileContent = await callApi(`file2/${this.props.filePath}`)
        this.setState({termInfos: fileContent.terms})
    }

    componentDidMount(): void {
        this.readContent()
    }

    componentDidUpdate(prevProps: Readonly<TfidfProps>): void {
        if(prevProps.filePath != this.props.filePath) {
            this.readContent()
        }
    }

    createPlusMinusClass(plusMinus: PlusMinus) {
        switch (plusMinus) {
            case "+":
                return "plus"

            case "-":
                return this.state.showMinus ? "showMinus" : "hideMinus"

            default:
                return "na"
        }
    }

    render() {
        return <div className="list tfidf">
            {this.state.termInfos.map(termInfo => <div className={`listrow withline ${this.createPlusMinusClass(termInfo.plusOrMinus)}`} key={termInfo.term}>
                <div>{termInfo.term}</div>
                <div>{termInfo.tfidfValue}</div>
            </div>)}
        </div>
    }
}
