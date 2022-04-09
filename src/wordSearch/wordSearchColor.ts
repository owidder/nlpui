export const wordSearchColor = (current: number, max: number, dark = true): string => {
    const alpha = Math.max(current / max, .2);
    return dark ? `rgba(255, 173, 189, ${alpha})` : `rgba(249, 224, 229, ${alpha})`;
}
