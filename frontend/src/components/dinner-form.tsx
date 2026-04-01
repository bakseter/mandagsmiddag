import { format, formatISO } from 'date-fns';
import { Controller, useForm } from 'react-hook-form';

import FormSubmitStatus from '@/components/form-submit-status';
import { type Dinner, usePutDinnerMutation } from '@/services/dinner';
import { useGetUsersQuery } from '@/services/user';

interface FormValues {
    id: string;
    hostUserId: string;
    date: string;
    food: string;
    filmTitle: string;
    filmImdbUrl: string;
    participants: string[];
}

interface Props {
    dinner?: Dinner | null;
}

const inputClassName =
    'w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200';

const labelClassName = 'mb-1.5 block text-sm font-medium text-zinc-800';

const DinnerForm = ({ dinner = null }: Props) => {
    const { data: users, isLoading: usersLoading } = useGetUsersQuery();
    const [addDinner, { isLoading, isSuccess, error }] = usePutDinnerMutation();

    const isEditMode = Boolean(dinner);

    const { handleSubmit, control, reset } = useForm<FormValues>({
        defaultValues: {
            id: dinner?.id ? String(dinner.id) : '',
            hostUserId: dinner ? String(dinner.hostUserId) : '',
            date: dinner?.date
                ? format(new Date(dinner.date), 'yyyy-MM-dd')
                : '',
            food: dinner?.food ?? '',
            filmTitle: dinner?.filmTitle ?? '',
            filmImdbUrl: dinner?.filmImdbUrl ?? '',
            participants: dinner?.participantIds?.map(String) ?? [],
        },
    });

    const onSubmit = async (data: FormValues) => {
        try {
            const formDinner: Dinner = {
                id: Number(data.id),
                hostUserId: Number(data.hostUserId),
                date: formatISO(new Date(data.date)),
                food: data.food,
                filmTitle: data.filmTitle,
                filmImdbUrl: data.filmImdbUrl,
                participantIds: data.participants.map(Number),
            };

            await addDinner(formDinner).unwrap();
            reset();
        } catch (error_) {
            console.error(error_);
        }
    };

    if (usersLoading) {
        return (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-zinc-600">Laster brukere...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                    {isEditMode ? 'Oppdater middag' : 'Opprett en ny middag'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Fyll inn informasjon om arrangør, dato, mat, film og hvem
                    som møtte opp.
                </p>
            </div>

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

                <div className="grid gap-5 md:grid-cols-2">
                    <div>
                        <label className={labelClassName}>Arrangør</label>
                        <Controller
                            name="hostUserId"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <select
                                    {...field}
                                    className={inputClassName}
                                    required
                                >
                                    <option value="">Velg arrangør</option>
                                    {users?.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                    </div>

                    <div>
                        <label className={labelClassName}>Dato</label>
                        <Controller
                            name="date"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <input
                                    type="date"
                                    {...field}
                                    className={inputClassName}
                                    required
                                />
                            )}
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClassName}>Matrett</label>
                    <Controller
                        name="food"
                        control={control}
                        render={({ field }) => (
                            <input
                                type="text"
                                {...field}
                                placeholder="For eksempel lasagne"
                                className={inputClassName}
                            />
                        )}
                    />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <div>
                        <label className={labelClassName}>Filmtittel</label>
                        <Controller
                            name="filmTitle"
                            control={control}
                            render={({ field }) => (
                                <input
                                    type="text"
                                    {...field}
                                    placeholder="For eksempel Interstellar"
                                    className={inputClassName}
                                />
                            )}
                        />
                    </div>

                    <div>
                        <label className={labelClassName}>IMDb-lenke</label>
                        <Controller
                            name="filmImdbUrl"
                            control={control}
                            render={({ field }) => (
                                <input
                                    type="text"
                                    {...field}
                                    placeholder="https://www.imdb.com/..."
                                    className={inputClassName}
                                />
                            )}
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClassName}>Hvem møtte opp?</label>
                    <Controller
                        name="participants"
                        control={control}
                        render={({ field }) => (
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {users?.map((user) => {
                                        const checked = field.value.includes(
                                            String(user.id)
                                        );

                                        return (
                                            <label
                                                key={user.id}
                                                className="flex items-center gap-3 rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-zinc-700 transition hover:border-zinc-200"
                                            >
                                                <input
                                                    type="checkbox"
                                                    value={user.id}
                                                    checked={checked}
                                                    onChange={(event) => {
                                                        const id = String(
                                                            user.id
                                                        );

                                                        if (
                                                            event.target.checked
                                                        ) {
                                                            field.onChange([
                                                                ...field.value,
                                                                id,
                                                            ]);
                                                        } else {
                                                            field.onChange(
                                                                field.value.filter(
                                                                    (
                                                                        value: string
                                                                    ) =>
                                                                        value !==
                                                                        id
                                                                )
                                                            );
                                                        }
                                                    }}
                                                    className="h-4 w-4 rounded border-zinc-300"
                                                />
                                                <span>{user.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    />
                </div>

                <FormSubmitStatus
                    whatIsBeingSubmitted="Middag"
                    isEditMode={isEditMode}
                    isSubmitting={isLoading}
                    submittedSuccessfully={isSuccess}
                    error={error}
                />
            </form>
        </div>
    );
};

export default DinnerForm;
