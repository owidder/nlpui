import * as React from "react";
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    useParams
} from "react-router-dom";

import {Topics} from "./Topics";

export const TopicsBrowserRouter = () => {

    return <Router>
        <Switch>
            <Route path="/topic/:num_topics/:num_entries" children={<_Topics/>}/>
        </Switch>
    </Router>
}

const _Topics = () => {
    const {num_topics, num_entries} = useParams();

    return <Topics num_topics={num_topics} num_entries={num_entries}/>
}
