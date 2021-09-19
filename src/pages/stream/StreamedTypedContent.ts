export interface TypedContent {
    type: string
    content: string
}

export class StreamedTypedContent {

    private residuum: string = "";

    public parse(text: string): TypedContent[] {
        const typedContentList: TypedContent[] = [];
        const textWithResiduum = this.residuum.concat(text);

        if(textWithResiduum.indexOf(";") > -1 && textWithResiduum.indexOf(":") > -1) {
            const parts = textWithResiduum.split(";");

            for(let i = 0; i < parts.length-1; i++) {
                if(parts[i].indexOf(":") < 0) {
                    window.alert(`No colon found: ${textWithResiduum.indexOf(";")} / ${parts[i]}`);
                }
                const [type, content] = parts[i].split(":");
                typedContentList.push({type, content});
            }
            this.residuum = parts[parts.length-1];
        } else {
            this.residuum += text;
        }

        return typedContentList
    }
}
