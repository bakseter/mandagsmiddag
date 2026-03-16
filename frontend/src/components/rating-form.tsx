import { Controller, useForm } from 'react-hook-form';

import { useGetDinnerByIdQuery } from '@/services/dinner';
import { type Rating, usePutRatingMutation } from '@/services/rating';
import { useGetCurrentUserQuery, useGetUsersQuery } from '@/services/user';

interface FormValues {
    id: string;
    userId: string;
    dinnerId: string;
    dinnerScore: number | null;
    filmScore: number;
}

interface Props {
    dinnerId: number;
    rating?: Rating | null;
    userId?: number | null;
}

const inputClassName =
    'w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200';

const labelClassName = 'mb-1.5 block text-sm font-medium text-zinc-800';

// eslint-disable-next-line max-statements
const RatingForm = ({ dinnerId, rating = null, userId = null }: Props) => {
    const { data: currentUser, isLoading: currentUserLoading } =
        useGetCurrentUserQuery();

    // TODO: Get only the user with userId instead of all
    const { data: users, isLoading: usersAreLoading } = useGetUsersQuery();
    const { data: dinner, isLoading: dinnersLoading } =
        useGetDinnerByIdQuery(dinnerId);

    const [addRating, { isLoading, isSuccess, error }] = usePutRatingMutation();

    const userIdToUse: string = (() => {
        if (currentUser?.isAdmin) {
            return String(userId ?? currentUser.id);
        }

        return String(currentUser?.id ?? '');
    })();

    const ratingUserId = currentUser?.isAdmin
        ? (userId ?? currentUser?.id)
        : currentUser?.id;
    const isHost = dinner !== undefined && dinner.hostUserId === ratingUserId;

    const { handleSubmit, control, reset, setValue, watch } =
        useForm<FormValues>({
            defaultValues: {
                id: rating ? String(rating.id) : '',
                dinnerId: String(dinnerId),
                dinnerScore: rating ? rating.dinnerScore : 0,
                filmScore: rating?.filmScore ?? 0,
            },
        });

    const dinnerScore = watch('dinnerScore');
    const didNotEat = isHost || dinnerScore === null;

    if (currentUserLoading || usersAreLoading || dinnersLoading) {
        return <p>Loading...</p>;
    }

    const userBeingImpersonated = users?.find((user) => user.id === userId);
    const isEditMode = Boolean(rating);

    const handleToggleDidNotEat = () => {
        if (isHost) return; // Host cannot toggle — always disabled
        if (dinnerScore === null) {
            setValue('dinnerScore', 0);
        } else {
            setValue('dinnerScore', null);
        }
    };

    // Override userId from search param if user is admin.

    const onSubmit = async (data: FormValues) => {
        try {
            const formRating: Rating = {
                id: Number(data.id),
                userId: Number(userIdToUse),
                dinnerId: Number(data.dinnerId),
                dinnerScore: data.dinnerScore,
                filmScore: data.filmScore,
            };

            await addRating(formRating).unwrap();
            reset();
        } catch (error_) {
            console.error(error_);
        }
    };

    return (
        <div className="mt-4 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                    {isEditMode ? 'Rediger' : 'Legg til'} rating
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Gi en score fra 0 til 10 for både middag og film.
                </p>
            </div>

            {currentUser?.isAdmin && userBeingImpersonated && (
                <p className="mb-4 rounded-lg bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
                    Du {isEditMode ? 'endrer nå' : 'legger nå til'} en rating på
                    vegne av{' '}
                    <span className="font-medium">
                        {userBeingImpersonated.name}
                    </span>
                    .
                </p>
            )}

            {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {isEditMode && (
                    <Controller
                        name="id"
                        control={control}
                        render={({ field }) => (
                            <input type="hidden" {...field} />
                        )}
                    />
                )}

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
                            rules={{
                                required: !didNotEat,
                                min: didNotEat ? undefined : 1,
                                max: didNotEat ? undefined : 10,
                            }}
                            render={({ field }) => (
                                <input
                                    type="number"
                                    {...field}
                                    value={
                                        field.value === null
                                            ? ''
                                            : (field.value ?? '')
                                    }
                                    onChange={(event) => {
                                        field.onChange(
                                            event.target.valueAsNumber
                                        );
                                    }}
                                    min={1}
                                    max={10}
                                    step={1}
                                    placeholder="1–10"
                                    disabled={didNotEat}
                                    className={`${inputClassName} disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400`}
                                />
                            )}
                        />
                        {didNotEat && (
                            <p className="mt-1.5 text-xs text-zinc-500">
                                {isHost
                                    ? 'Du er vert for denne middagen og kan ikke rate maten.'
                                    : 'Du har markert at du ikke spiste.'}
                            </p>
                        )}
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
                                    onChange={(event) => {
                                        field.onChange(
                                            event.target.valueAsNumber
                                        );
                                    }}
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

                {!isHost && (
                    <div>
                        <button
                            type="button"
                            onClick={handleToggleDidNotEat}
                            className={`inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium transition ${
                                didNotEat
                                    ? 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-700'
                                    : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                            }`}
                        >
                            Jeg spiste ikke
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                    {/* eslint-disable no-nested-ternary */}
                    <button
                        type="submit"
                        className="inline-flex items-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? 'Lagrer...'
                            : isEditMode
                              ? 'Oppdater rating'
                              : 'Legg til rating'}
                    </button>
                    {/* eslint-enable no-nested-ternary */}

                    {isSuccess && (
                        <p className="text-sm text-green-700">
                            Rating {isEditMode ? 'oppdatert' : 'lagt til'}!
                        </p>
                    )}

                    {error && (
                        <p className="text-sm text-red-600">
                            En feil oppstod mens ratingen ble{' '}
                            {isEditMode ? 'oppdatert' : 'lagt til'}.
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
};

export default RatingForm;
