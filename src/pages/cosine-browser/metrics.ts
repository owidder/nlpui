export const METRICS = ["sum", "max", "avg", "count", "max*count", "maxMax", "avgMax"];
export const DEFAULT_METRIC = "sum";

export interface WordAndMetrics {
    words: [string]
    stem: string
    [metric: string]: number | any
}
