import * as React from "react";
import {useState, useEffect} from "react";

import {callApi} from "../../util/fetchUtil";

import "../styles.scss"

interface TopicsProps {
    num_topics: number;
    num_entries: number;
}

interface TopicEntry {
    word: string;
    value: number;
}

type Topic = TopicEntry[];

export const Topics = ({num_topics, num_entries}: TopicsProps) => {
    const [isLoading, setIsLoading] = useState(true)
    const [topics, setTopics] = useState([] as Topic[])

    useEffect(() => {
        setIsLoading(true)
        readContent()
    }, [num_topics, num_entries])

    const readContent = async () => {
        const topics: Topic[] = await callApi(`/allTopics/${num_topics}/${num_entries}`)
        setTopics(topics)
        setIsLoading(false)
    }

    if(isLoading) {
        return <div>Loading...</div>
    }

    return <div className="list">
        {topics.map((topic, index) => <div className="listrow" key={index}>
            {topic.map((topicEntry, index) => <div className="stringcell" key={index}>{topicEntry.word}</div>)}
        </div>)}
    </div>
}
