export const wordSearchColor = (current: number, max: number, dark = true): string => {
    if(current > 0) {
        const alpha = Math.max(current / max, .1);
        return dark ? `rgba(255, 173, 189, ${alpha})` : `rgba(249, 224, 229, ${alpha})`;
    }

    return "white";
}
