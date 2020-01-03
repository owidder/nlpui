import * as React from "react";
import {useState, useEffect} from "react";

import {callApi} from "../../util/fetchUtil";

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

    return <div>{JSON.stringify(topics)}</div>
}
