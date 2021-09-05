// kudos to https://codepen.io/juanigallo (https://codepen.io/juanigallo/pen/WNbZgmV)
import * as React from "react";

import "./ProgressBar.scss";

interface ProgressBarProps {
    message: string
    max: number
    current: number
}

export const ProgressBar = ({message, max, current}: ProgressBarProps) => {

    const progress = (current / max) * 100;

    return (
        <div className="container">
            <div className="progressbar-container">
                <div className="progressbar-complete" style={{width: `${progress}%`}}>
                    <div className="progressbar-liquid"></div>
                </div>
                <span className="progressbar">{message}: {current} / {max}</span>
            </div>
        </div>
    )
}