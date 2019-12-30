import * as React from "react";

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

    async readContent() {
        const {num_topics, num_entries} = this.props
        const topics: Topic[] = await callApi(`/allTopics/${num_topics}/${num_entries}`)
        this.setState({topics, isLoading: false})
    }

    componentDidMount(): void {
        this.readContent()
    }

    componentDidUpdate(): void {
        this.readContent()
    }

    render()  {
        if(this.state.isLoading) {
            return <div>Loading...</div>
        }

        return <div>{JSON.stringify(this.state.topics)}</div>
    }
}
