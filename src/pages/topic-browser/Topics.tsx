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

interface TopicsState {
    topics: Topic[];
    isLoading: boolean;
}

export class Topics extends React.Component<TopicsProps, TopicsState> {

    readonly state: TopicsState = {isLoading: true, topics: []}

    async readContent() {
        const {num_topics, num_entries} = this.props
        const topics: Topic[] = await callApi(`/allTopics/${num_topics}/${num_entries}`)
        this.setState({topics, isLoading: false})
    }

    componentDidMount(): void {
        this.readContent()
    }

    componentDidUpdate(prevProps:TopicsProps): void {
        if(this.props.num_entries != prevProps.num_entries || this.props.num_topics != prevProps.num_topics) {
            this.setState({isLoading: true})
            this.readContent()
        }
    }

    render()  {
        if(this.state.isLoading) {
            return <div>Loading...</div>
        }

        return <div>{JSON.stringify(this.state.topics)}</div>
    }
}

export const Topics2 = ({num_topics, num_entries}: TopicsProps) => {
    const [isLoading, setIsLoading] = useState(true)
    const [topics, setTopics] = useState([])

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
