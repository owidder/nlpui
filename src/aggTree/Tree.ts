export interface Tree {
    name: string
    words?: string[]
    tfidfValues?: number[]
    sumValues?: number[]
    avgValues?: number[]
    maxValues?: number[]
    countValues?: number[]
    value?: number
    wordCountValue?: number
    maxWordCountInBranch?: number
    wordTfidfValue?: number
    maxWordTfidfValueInBranch?: number
    children?: Tree[]
}
