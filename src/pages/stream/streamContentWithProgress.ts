import {callStreamApi} from "./streamApi";
import {StreamedTypedContent, TypedContent} from "./StreamedTypedContent";
import * as LZUTF8 from "lzutf8";

declare type NumberCallback = (content: number) => void;
declare type StringCallback = (content: string) => void;
declare type AnyCallback = (content: any) => void;

export const streamContentWithProgress = (uri: string, progressCallback: NumberCallback, numberOfFilesCallback: NumberCallback, progressTextCallback: StringCallback, jsonCallback: AnyCallback) => {

    const streamedTypedContent = new StreamedTypedContent();

    callStreamApi(uri, (text) => {
        const typedContentList: TypedContent[] = streamedTypedContent.parse(text);

        typedContentList.forEach(({type, content}) => {
            switch (type) {
                case "progress":
                    progressCallback(Number(content));
                    break

                case "progress-text":
                    progressTextCallback(content);
                    break

                case "number-of-files":
                    numberOfFilesCallback(Number(content));
                    break

                case "jsonz":
                    LZUTF8.decompressAsync(content, {inputEncoding: "Base64"}, (result, error) => {
                        if (error) {
                            window.alert(`cannot unzip: ${error.message}`)
                        } else {
                            const tree = JSON.parse(result);
                            progressCallback(0);
                            progressTextCallback("");
                            numberOfFilesCallback(0);
                            jsonCallback(tree);
                        }
                    })
                    break

                default:
                    window.alert(`type: ${type}, content: ${content}`)
            }
        });

    })
}