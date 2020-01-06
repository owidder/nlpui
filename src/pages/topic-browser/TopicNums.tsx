import * as React from "react"
import {useState, useEffect} from "react"
import {Link} from "react-router-dom"

import {callApi} from "../../util/fetchUtil"

export const TopicNums = () => {
    const [topicNums, setTopicNums] = useState([] as number[])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        readContent()
    }, [])

    const readContent = async () => {
        const topicNums: number[] = await callApi("/topicNums")
        setTopicNums(topicNums)
        setIsLoading(false)
    }

    if(isLoading) {
        return <div>...</div>
    }

    return <div className="list">
        <ul>
            {topicNums.map((topicNum, index) => <div key={index}><li><Link to={`/topic/${topicNum}/8`}>{topicNum}</Link></li></div>)}
        </ul>
    </div>
}
