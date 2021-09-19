import * as React from "react";
import {useEffect, useState} from "react";
import {callStreamApi} from "../../util/fetchUtil";
import {showTreemap} from "./treemapGraph";
import {StreamedTypedContent, TypedContent} from "../stream/StreamedTypedContent";
import * as LZUTF8 from "lzutf8";

import "./tree.scss"
import {ProgressBar} from "../../progress/ProgressBar";

interface TreemapWithProgressProps {
    path: string
    width: number
    height: number
}

export const TreemapWithProgress = ({path, width, height}: TreemapWithProgressProps) => {
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState("");
    const [numberOfFiles, setNumberOfFiles] = useState(0);

    const streamedTypedContent = new StreamedTypedContent();

    useEffect(() => {
        callStreamApi(`/api/subAgg/folder/${path}`, (text: string) => {
            const typedContentList: TypedContent[] = streamedTypedContent.parse(text);

            typedContentList.forEach(({type, content}) => {
                switch (type) {
                    case "progress":
                        setProgress(Number(content));
                        break

                    case "progress-text":
                        setProgressText(content);
                        break

                    case "number-of-files":
                        setNumberOfFiles(Number(content));
                        break

                    case "jsonz":
                        LZUTF8.decompressAsync(content, {inputEncoding: "Base64"}, (result, error) => {
                            if (error) {
                                window.alert(`cannot unzip: ${error.message}`)
                            } else {
                                const tree = JSON.parse(result);
                                setProgress(0);
                                setProgressText("");
                                setNumberOfFiles(0);
                                showTreemap("#treemap", tree, width, height)
                            }
                        })
                        break

                    default:
                        window.alert(`type: ${type}, content: ${content}`)
                }
            });
        })

    }, [])

    return <div id="treemap">
        {
            (progress > 0 && progressText.length > 0 && numberOfFiles > 0) ?
                <ProgressBar message={progressText} max={numberOfFiles} current={progress}/> : <span/>
        }
    </div>
}
