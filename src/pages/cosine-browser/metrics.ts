export const METRICS = ["sum", "max", "avg", "count", "max*count"];
export const DEFAULT_METRIC = "sum";

export interface WordAndMetrics {
    word: string
    [metric: string]: number | any
}
