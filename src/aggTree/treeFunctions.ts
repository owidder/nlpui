import {Tree} from "./Tree";

const compareToFeature = (word: string, feature: string) => (word.toLowerCase() == feature.toLowerCase());

export const addMaxWordCount = (siblings: Tree[]) => {
    const maxWordCountInSiblings = siblings.reduce((_max, sibling) => _max > sibling.wordCountValue ? _max : sibling.wordCountValue, 0);
    siblings.forEach(sibling => {
        sibling.maxWordCountInBranch = maxWordCountInSiblings;
        if (sibling.children) {
            addMaxWordCount(sibling.children)
        }
    })
}

export const addMaxWordTfidf = (siblings: Tree[]) => {
    const maxWordTfidfInSiblings = siblings.reduce((_max, sibling) => _max > sibling.wordTfidfValue ? _max : sibling.wordTfidfValue, 0);
    siblings.forEach(sibling => {
        sibling.maxWordTfidfValueInBranch = maxWordTfidfInSiblings;
        if (sibling.children) {
            addMaxWordTfidf(sibling.children)
        }
    })
}

export const addWordCount = (branch: Tree, word: string): number => {
    branch.wordCountValue = branch.children ? branch.children.reduce((_count, child) => {
            return _count + addWordCount(child, word)
        }, 0)
        : 0;

    branch.wordCountValue = branch.words ?
        branch.words.reduce((_countValue, w, i) => {
            return compareToFeature(w, word) ? _countValue + branch.countValues[i] : _countValue
        }, 0)
        : 0;

    return branch.wordCountValue
}

export const addWordTfidf = (branch: Tree, word: string): number => {
    branch.wordTfidfValue = branch.children ? branch.children.reduce((_count, child) => {
            return _count + addWordTfidf(child, word)
        }, 0)
        : 0;

    branch.wordTfidfValue += branch.words ?
        branch.words.reduce((_tfidfValue, w, i) => {
            return compareToFeature(w, word) ? _tfidfValue + branch.tfidfValues[i] : _tfidfValue
        }, 0)
        : 0

    return branch.wordTfidfValue
}
