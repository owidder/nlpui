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

    setPlusOrMinus(termName: string, plusOrMinus: PlusMinus) {
        callApi(`termInfo/${termName}/set`, "POST", {plusOrMinus})
        const termInfos = this.state.termInfos.map(termInfo => {
            return termInfo.term == termName ? {...termInfo, plusOrMinus} : termInfo
        })
        this.setState({termInfos})
    }

    render() {
        return <div className="list tfidf">
            {this.state.termInfos.map(termInfo => <div className={`listrow withline ${this.createPlusMinusClass(termInfo.plusOrMinus)}`} key={termInfo.term}>
                <div>{termInfo.term}</div>
                <div className="next-to-each-other">
                    <div className="clickable" onClick={() => this.setPlusOrMinus(termInfo.term, "+")}><i className="material-icons small">add_circle_outline</i></div>
                    <div className="clickable" onClick={() => this.setPlusOrMinus(termInfo.term, "-")}><i className="material-icons small">remove_circle_outline</i></div>
                    <div className="clickable" onClick={() => this.setPlusOrMinus(termInfo.term, "?")}><i className="material-icons small">help_outline</i></div>
                </div>
            </div>)}
        </div>
    }
}
