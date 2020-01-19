import * as React from "react"
import {useState, useEffect} from "react"

import {callApi} from "../../util/fetchUtil"

import "../styles.scss"

interface OnepagerTableProps {
    name: string
}

interface Onepager {
    name?: string
    beschreibung?: string
    kunde?: string
    projekt?: string[]
    PRkunde?: string[]
    technologien?: string[][]
    projektzeitraum?: string[]
    herausforderung?: string[]
    loesung?: string[]
    mehrwert?: string[]
    schlagworte?: []
    kompetenzbereich?: string[]
}

interface TermInfos {
    [key: string]: {plusOrMinus: "+" | "-" | "?" | "" | "T"}
}

export const OnepagerTable = ({name}: OnepagerTableProps) => {
    const [onepager, setOnepager] = useState({} as Onepager)
    const [isLoading, setIsLoading] = useState(true)
    const [wordCounts, setWordCounts] = useState({})
    const [termInfos, setTermInfos] = useState({} as TermInfos)

    const renderRow = (name: string, content: JSX.Element) => {
        if(content) {
            return <div>
                <div className="cell caption">{name}</div>
                <div className="cell">{content}</div>
            </div>
        }

        return <span/>
    }

    const showWords = (wordString: string) => {
        return <span>
            {wordString.replace("-", " ").split(" ").map((word, index) => {
                const count = wordCounts[word]
                const isTerm = termInfos[word] && termInfos[word].plusOrMinus == "+"
                const className = count > 0 ? `is-topic is-topic-${count}` : (isTerm ? "is-term" : "")
                return <span className={className} key={index} title={count}>{word} </span>
            })}
        </span>
    }

    const stringContent = (attribute: string) => {
        if(attribute) {
            return <span>{attribute}</span>
        }
        return undefined
    }

    const stringArrayContent = (attribute: string[]) => {
        if(attribute) {
            return <div>{attribute.map((s, i) => <div key={i}>{showWords(s)}</div>)}</div>
        }
        return undefined
    }

    const stringDoubleArrayContent = (attribute: string[][]) => {
        if(attribute) {
            return <div>
                {attribute.map((ss, i1) => ss.map((s, i2) => <div key={`${i1}-${i2}`}>{showWords(s)}</div>))}
            </div>
        }
        return undefined
    }

    useEffect(() => {
        init()
    }, [name])

    const init = async () => {
        const _onepager = await callApi(`onepager/${name}`)
        setOnepager(_onepager)

        if(Object.keys(wordCounts).length == 0) {
            const _wordCounts = await callApi("/wordCounts")
            setWordCounts(_wordCounts)
        }

        if(Object.keys(termInfos).length == 0) {
            const _termInfos = await callApi("/termInfos")
            setTermInfos(_termInfos)
        }

        setIsLoading(false)
    }

    if(!isLoading) {
        return <div className="list">
            {renderRow("Projekt", stringArrayContent(onepager.projekt))}
            {renderRow("Kunde", stringContent(onepager.kunde))}
            {renderRow("Beschreibung Kunde", stringArrayContent(onepager.PRkunde))}
            {renderRow("Technologien", stringDoubleArrayContent(onepager.technologien))}
            {renderRow("Herausforderungen", stringArrayContent(onepager.herausforderung))}
            {renderRow("Mehrwert", stringArrayContent(onepager.mehrwert))}
            {renderRow("Lösung", stringArrayContent(onepager.loesung))}
            {renderRow("Schlagworte", stringArrayContent(onepager.schlagworte))}
            {renderRow("Kompetenzbereich", stringArrayContent(onepager.kompetenzbereich))}
        </div>
    }

    return <div>Loading...</div>
}