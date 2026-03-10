import { Controller, useForm } from 'react-hook-form';
import { type Rating, usePutRatingMutation } from '../services/rating';
import { useGetCurrentUserQuery } from '../services/user';

interface FormValues {
    ratingId: number;
    userId: number;
    dinnerId: number;
    dinnerScore: number;
    filmScore: number;
}

interface Props {
    dinnerId: number;
}

const inputClassName =
    'w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200';

const labelClassName = 'mb-1.5 block text-sm font-medium text-zinc-800';

const RatingForm = ({ dinnerId }: Props) => {
    const { data: currentUser } = useGetCurrentUserQuery();

    const [addRating, { isLoading, isSuccess, error }] = usePutRatingMutation();

    const { handleSubmit, control, reset } = useForm<FormValues>({
        defaultValues: {
            ratingId: 0,
            userId: currentUser?.id ?? 0,
            dinnerId,
            dinnerScore: 0,
            filmScore: 0,
        },
    });

    const onSubmit = async (data: FormValues) => {
        try {
            const formRating: Rating = {
                id: data.ratingId,
                userId: Number(data.userId),
                dinnerId: Number(data.dinnerId),
                dinnerScore: Number(data.dinnerScore),
                filmScore: Number(data.filmScore),
            };

            await addRating(formRating).unwrap();
            reset({
                ratingId: 0,
                userId: currentUser?.id ?? 0,
                dinnerId,
                dinnerScore: 0,
                filmScore: 0,
            });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="mt-4 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                    Legg til rating
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Gi en score fra 0 til 10 for både middag og film.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Controller
                    name="dinnerId"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <input type="hidden" {...field} value={dinnerId} />
                    )}
                />

                <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <label className={labelClassName}>Middag</label>
                        <Controller
                            name="dinnerScore"
                            control={control}
                            rules={{ required: true, min: 0, max: 10 }}
                            render={({ field }) => (
                                <input
                                    type="number"
                                    {...field}
                                    min={0}
                                    max={10}
                                    step={1}
                                    placeholder="0–10"
                                    className={inputClassName}
                                />
                            )}
                        />
                    </div>

                    <div>
                        <label className={labelClassName}>Film</label>
                        <Controller
                            name="filmScore"
                            control={control}
                            rules={{ required: true, min: 0, max: 10 }}
                            render={({ field }) => (
                                <input
                                    type="number"
                                    {...field}
                                    min={0}
                                    max={10}
                                    step={1}
                                    placeholder="0–10"
                                    className={inputClassName}
                                />
                            )}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="submit"
                        className="inline-flex items-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Lagrer...' : 'Legg til rating'}
                    </button>

                    {isSuccess && (
                        <p className="text-sm text-green-700">
                            Rating lagt til.
                        </p>
                    )}

                    {error && (
                        <p className="text-sm text-red-600">
                            En feil oppstod mens ratingen ble lagt til.
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
};

export default RatingForm;
