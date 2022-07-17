export const METRICS = ["sum", "max", "avg", "count", "max*count", "maxMax", "avgMax"];
export const METRICS2 = ["sum2", "max2", "avg2", "count", "max*count2", "maxMax2", "avgMax2"];
export const DEFAULT_METRIC = "sum";

export interface WordAndMetrics {
    words: [string]
    stem: string
    [metric: string]: number | any
}

export type MetricValues = {[key in typeof METRICS[number]]: number}
