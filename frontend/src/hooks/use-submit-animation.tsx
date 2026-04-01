import { useEffect, useState } from 'react';

interface Options {
    minLoadingMs?: number;
    successMs?: number;
}

const useSubmitAnimation = (
    isSubmitting: boolean,
    isSuccess: boolean,
    isError: boolean,
    { minLoadingMs = 500, successMs = 2000 }: Options = {}
) => {
    const [showSuccess, setShowSuccess] = useState(false);
    const [showLoading, setShowLoading] = useState(false);

    useEffect(() => {
        if (!isSubmitting) {
            return;
        }

        // Schedule loading to appear after 0ms
        const loadingTimer = setTimeout(() => {
            setShowLoading(true);
        }, 0);

        /* eslint-disable consistent-return */
        return () => {
            clearTimeout(loadingTimer);
        };
        /* eslint-enable consistent-return */
    }, [isSubmitting]);

    useEffect(() => {
        if (!isSuccess) {
            return;
        }

        // Schedule the success animation after minLoadingMs
        const start = Date.now();

        const successTimer = setTimeout(
            () => {
                setShowLoading(false);
                setShowSuccess(true);

                // Schedule success to hide after successMs
                const resetTimer = setTimeout(() => {
                    setShowSuccess(false);
                }, successMs);

                return () => {
                    clearTimeout(resetTimer);
                };
            },
            minLoadingMs - (Date.now() - start)
        );

        /* eslint-disable consistent-return */
        return () => {
            clearTimeout(successTimer);
        };
        /* eslint-enable consistent-return */
    }, [isSuccess, minLoadingMs, successMs]);

    return {
        isIdle: !showLoading && !showSuccess && !isSubmitting && !isError,
        isLoading: showLoading,
        isSuccess: showSuccess,
        isError,
    };
};

export default useSubmitAnimation;
