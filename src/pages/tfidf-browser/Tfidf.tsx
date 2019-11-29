import * as React from "react";
import {css} from "@emotion/core";
import ClimbingBoxLoader from "react-spinners/ClipLoader";

import {callApi} from "../../util/fetchUtil";

interface TfidfProps {
    filePath: string
}

type PlusMinus = "+" | "-" | "?" | "" | "T"

interface TermInfo {
    term: string
    tfidfValue?: number
    plusOrMinus?: PlusMinus,
    maybeTechTerm?: boolean
}

interface TfidfState {
    termInfos: TermInfo[]
    showMinus: boolean
    isLoading: boolean
}

interface FileContent {
    path: string
    terms: TermInfo[]
}

const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;

export class Tfidf extends React.Component<TfidfProps, TfidfState> {

    readonly state: TfidfState = {termInfos: [], showMinus: true, isLoading: true}

    async readContent() {
        const fileContent: FileContent = await callApi(`file2/${this.props.filePath}`)
        this.setState({termInfos: fileContent.terms, isLoading: false})
    }

    componentDidMount(): void {
        this.readContent()
    }

    componentDidUpdate(prevProps: Readonly<TfidfProps>): void {
        if(prevProps.filePath != this.props.filePath) {
            this.readContent()
        }
    }

    createClassFromTermInfo(termInfo: TermInfo) {
        const maybeTechClass = (clazz: string) => termInfo.maybeTechTerm ? `${clazz} maybetech` : clazz;
        switch (termInfo.plusOrMinus) {
            case "+":
                return maybeTechClass("plus")

            case "T":
                return "tech"

            case "-":
                return maybeTechClass(this.state.showMinus ? "showMinus" : "hideMinus")

            case "?":
                return maybeTechClass("dontknow")

            default:
                return maybeTechClass("na")
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
        if(this.state.isLoading) {
            return <ClimbingBoxLoader
                css={override}
                size={150}
                color={"green"}
                loading={true}
            />
        }
        return <div className="list tfidf">
            {this.state.termInfos.map(termInfo => <div className={`listrow withline ${this.createClassFromTermInfo(termInfo)}`} key={termInfo.term}>
                <div>{termInfo.term}</div>
                <div className="next-to-each-other">
                    <div className="clickable" onClick={() => this.setPlusOrMinus(termInfo.term, "+")}><i className="material-icons small">{termInfo.plusOrMinus == "+" ? "add_circle" : "add_circle_outline"}</i></div>
                    <div className="clickable" onClick={() => this.setPlusOrMinus(termInfo.term, "-")}><i className="material-icons small">{termInfo.plusOrMinus == "-" ? "remove_circle" : "remove_circle_outline"}</i></div>
                    <div className="clickable" onClick={() => this.setPlusOrMinus(termInfo.term, "?")}><i className="material-icons small">{termInfo.plusOrMinus == "?" ? "help" : "help_outline"}</i></div>
                    <div className="clickable" onClick={() => this.setPlusOrMinus(termInfo.term, "")}><i className="material-icons small">highlight_off</i></div>
                </div>
            </div>)}
        </div>
    }
}
