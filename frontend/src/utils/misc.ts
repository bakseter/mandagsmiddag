const numberToString = (num: string | null): number | null => {
    if (!num) {
        return null;
    }

    const parsed = Number(num);

    return isNaN(parsed) ? null : parsed;
};

export { numberToString };
