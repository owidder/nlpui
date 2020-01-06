import * as React from "react"
import {
    HashRouter as Router,
    Switch,
    Route,
    Link,
    useParams
} from "react-router-dom"

import {Topics} from "./Topics"
import {TopicNums} from "./TopicNums"

export const TopicsBrowserRouter = () => {

    return <Router>
        <div className="row">
            <div className="col s1">
                <TopicNums/>
            </div>

            <div className="col s11">
                <Switch>
                    <Route path="/topic/:num_topics/:num_entries" children={<_Topics/>}/>
                </Switch>
            </div>
        </div>
    </Router>
}

const _Topics = () => {
    const {num_topics, num_entries} = useParams();

    return <Topics num_topics={num_topics} num_entries={num_entries}/>
}
