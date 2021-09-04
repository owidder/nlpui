import * as React from "react";
import {useState, useEffect} from "react";

interface ProgressProps {
    max: number
}

export const Progress = ({max}: ProgressProps) => {
    const [ctr, setCtr] = useState("");
    const [start, setStart] = useState(false);
    const [obj, setObj] = useState({})

    const decoder = new TextDecoder();

    useEffect(() => {
        if(start) {
            fetch(`/api/stream?max=${max}`).then(async response => {
                const reader = response.body.getReader();
                while(true) {
                    const {done, value} = await reader.read();
                    const decoded = decoder.decode(value);
                    console.log(decoded)
                    if(decoded.startsWith("ctr:")) {
                        setCtr(decoded.substr(4))
                    } else if(decoded.startsWith("json:")){
                        setObj(JSON.parse(decoded.substr(5)))
                    }
                    if(done) {
                        setStart(false);
                        break;
                    }
                }
            })
        }
    }, [start])

    const toggle = () => setStart(!start)

    return <div>
        <button onClick={toggle}>{start ? "Stop" : "Start"}</button>
        <br/>
        Counter: {ctr}
        <br/>
        object: {JSON.stringify(obj)}
    </div>
}
