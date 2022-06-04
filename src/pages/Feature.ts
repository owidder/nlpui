export interface Feature {
    features: [string]
    value: number
}

export const sortFeatures = (features: Feature[]): Feature[] => {
    return features.sort((f1, f2) => f2.value - f1.value)
}

export const smallestFeatureValue = (features: Feature[]): number => {
    return features.reduce((_smallest, feature) => feature.value < _smallest ? feature.value : _smallest, Number.MAX_VALUE)
}
