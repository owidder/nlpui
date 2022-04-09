export const wordSearchColor = (current: number, max: number, light = false): string => {
    const alpha = Math.max(current / max, .5);
    return light ? `rgba(255, 173, 189, ${alpha})` : `rgba(249, 224, 229, ${alpha})`;
}
