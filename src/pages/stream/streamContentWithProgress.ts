import {callStreamApi} from "./streamApi";
import {StreamedTypedContent, TypedContent} from "./StreamedTypedContent";
import * as LZUTF8 from "lzutf8";

declare type NumberCallback = (content: number) => void;
declare type StringCallback = (content: string) => void;
declare type AnyCallback = (content: any) => void;

export const streamContentWithProgress = (uri: string, progressCallback: NumberCallback, maxProgressCallback: NumberCallback, progressTextCallback: StringCallback, jsonCallback: AnyCallback) => {

    const streamedTypedContent = new StreamedTypedContent();

    callStreamApi(uri, (text) => {
        const typedContentList: TypedContent[] = streamedTypedContent.parse(text);

        typedContentList.forEach(({type, content}) => {
            switch (type) {
                case "progress":
                    progressCallback(Number(content));
                    break

                case "progress-text":
                    console.log(`${type}: ${content}`)
                    progressTextCallback(content);
                    break

                case "max-progress":
                    console.log(`${type}: ${content}`)
                    maxProgressCallback(Number(content));
                    break

                case "jsonz":
                    LZUTF8.decompressAsync(content, {inputEncoding: "Base64"}, (result, error) => {
                        if (error) {
                            window.alert(`cannot unzip: ${error.message}`)
                        } else {
                            const object = JSON.parse(result);
                            progressCallback(0);
                            progressTextCallback("");
                            maxProgressCallback(0);
                            jsonCallback(object);
                        }
                    })
                    break

                default:
                    console.error(`type: ${type}, content: ${content}`)
            }
        });

    })
}