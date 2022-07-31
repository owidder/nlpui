export const METRICS2 = ["sum2", "max2", "avg2", "count2", "max*count2", "maxMax2", "avgMax2"];
export const DEFAULT_METRIC = "sum2";

export interface WordAndMetrics {
    words: [string]
    stem: string
    [metric: string]: number | any
}
