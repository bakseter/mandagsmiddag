import { type SerializedError } from '@reduxjs/toolkit';
import { type FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { CircleCheckBig, CircleX } from 'lucide-react';

import Spinner from '@/components/spinner';
import useSubmitAnimation from '@/hooks/use-submit-animation';

interface Props {
    whatIsBeingSubmitted: string;
    isEditMode: boolean;
    isSubmitting: boolean;
    submittedSuccessfully: boolean;
    error?: FetchBaseQueryError | SerializedError;
}

const FormSubmitStatus = ({
    whatIsBeingSubmitted,
    isEditMode,
    isSubmitting,
    submittedSuccessfully,
    error,
}: Props) => {
    const submitText = `${isEditMode ? 'Oppdater' : 'Legg til'} ${whatIsBeingSubmitted.toLowerCase()}`;
    const successText = isEditMode ? 'Oppdatert!' : 'Lagt til!';
    const errorText = 'Noe gikk galt';

    const { isLoading, isSuccess, isError } = useSubmitAnimation(
        isSubmitting,
        submittedSuccessfully,
        Boolean(error)
    );

    return (
        <div className="flex items-center gap-3 pt-2">
            <button
                type="submit"
                disabled={isLoading}
                className="
        relative inline-flex items-center justify-center gap-2
        rounded-xl bg-zinc-900 px-4 py-2.5
        text-sm font-medium text-white
        transition-all duration-150 ease-out
        hover:bg-zinc-700
        active:scale-95 active:bg-zinc-800
        disabled:cursor-not-allowed disabled:opacity-60
    "
            >
                {/* Idle text */}
                <span
                    className={`transition-all duration-200 ${
                        isLoading || isSuccess || isError
                            ? 'opacity-0 -translate-y-1'
                            : 'opacity-100 translate-y-0'
                    }`}
                >
                    {submitText}
                </span>

                {/* Spinner */}
                <span
                    className={`absolute flex items-center justify-center transition-all duration-200 ${
                        isLoading
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-75'
                    }`}
                >
                    <Spinner size={20} />
                </span>

                {/* Success */}
                <span
                    className={`absolute flex items-center transition-all duration-300 ${
                        isSuccess
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-75'
                    }`}
                >
                    <CircleCheckBig
                        size={20}
                        className="text-green-400 animate-[pop_0.35s_ease-out]"
                    />
                    <span className="ml-2">{successText}</span>
                </span>

                {/* Error */}
                <span
                    className={`absolute flex items-center transition-all duration-300 ${
                        isError ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                    }`}
                >
                    <CircleX
                        size={20}
                        className="text-red-400 animate-[pop_0.35s_ease-out]"
                    />
                    <span className="ml-2">{errorText}</span>
                </span>
            </button>
        </div>
    );
};

export default FormSubmitStatus;
