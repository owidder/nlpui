import {srcPathFromPath} from "../srcFromPath";
import {VscGithub} from "react-icons/vsc";
import * as React from "react";

interface SrcPathLinkProps {
    path: string
    srcPathMap: any
}

export const SrcPathLink = ({path, srcPathMap}: SrcPathLinkProps) => {

    const srcPath = srcPathFromPath(path, srcPathMap);
    if(srcPath.length > 0) {
        return <a target="_blank" href={srcPath}><VscGithub/></a>
    } else {
        return <span style={{color: "lightgray"}}><VscGithub/></span>
    }
}