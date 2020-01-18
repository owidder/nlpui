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

export const OnepagerTable = ({name}: OnepagerTableProps) => {
    const [onepager, setOnepager] = useState({} as Onepager)
    const [isLoading, setIsLoading] = useState(true)

    const renderRow = (name: string, content: JSX.Element) => {
        if(content) {
            return <div>
                <div className="cell caption">{name}</div>
                <div className="cell">{content}</div>
            </div>
        }

        return <span/>
    }

    const stringContent = (attribute: string) => {
        if(attribute) {
            return <span>{attribute}</span>
        }
        return undefined
    }

    const stringArrayContent = (attribute: string[]) => {
        if(attribute) {
            return <span>{attribute.map((s, i) => <span key={i}>{s}<br/></span>)}</span>
        }
        return undefined
    }

    const stringDoubleArrayContent = (attribute: string[][]) => {
        if(attribute) {
            return <span key={Math.random().toString()}>
                {attribute.map((ss, i1) => ss.map((s, i2) => <span key={`${i1}-${i2}`}>{s}<br/></span>))}
            </span>
        }
        return undefined
    }

    useEffect(() => {
        callApi(`onepager/${name}`).then((_onepager: Onepager) => {
            setOnepager(_onepager)
            setIsLoading(false)
        })
    }, [name])

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