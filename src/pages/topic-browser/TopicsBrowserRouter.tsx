import * as React from "react";
import {
    HashRouter as Router,
    Switch,
    Route,
    Link,
    useParams
} from "react-router-dom";

import {Topics, Topics2} from "./Topics";

export const TopicsBrowserRouter = () => {

    return <Router>
        <div className="row">
            <div className="col s2">
                <ul>
                    <li>
                        <Link to="/topic/10/5">topic/10/5</Link>
                    </li>
                    <li>
                        <Link to="/topic/10/15">topic/10/15</Link>
                    </li>
                    <li>
                        <Link to="/topic/20/25">topic/20/25</Link>
                    </li>
                </ul>
            </div>

            <div className="col s10">
                <Switch>
                    <Route path="/topic/:num_topics/:num_entries" children={<_Topics/>}/>
                </Switch>
            </div>
        </div>
    </Router>
}

const _Topics = () => {
    const {num_topics, num_entries} = useParams();

    return <Topics2 num_topics={num_topics} num_entries={num_entries}/>
}
