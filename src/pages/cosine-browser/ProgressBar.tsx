// kudos to https://codepen.io/juanigallo (https://codepen.io/juanigallo/pen/WNbZgmV)
import * as React from "react";

import "./ProgressBar.scss";

interface ProgressBarProps {
    max: number
    current: number
}

export const ProgressBar = ({max, current}: ProgressBarProps) => {

    const progress = (current / max) * 100;

    return (
        <div className="container">
            <div className="progressbar-container">
                <div className="progressbar-complete" style={{width: `${progress}%`}}>
                    <div className="progressbar-liquid"></div>
                </div>
                <span className="progressbar">Computing cosines: {current} / {max}</span>
            </div>
        </div>
    )
}