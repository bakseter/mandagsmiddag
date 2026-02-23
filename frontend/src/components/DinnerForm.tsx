import { Controller, useForm } from 'react-hook-form';
import { type Dinner, usePutDinnerMutation } from '../services/dinner';
import { formatISO } from 'date-fns';
import { useGetUsersQuery } from '../services/user';

interface FormValues {
    id: string;
    host: string;
    date: string;
    food: string;
    film: string;
    participants: string[];
}

interface Props {
    dinner?: Dinner | null;
}

const DinnerForm = ({ dinner = null }: Props) => {
    const { data: users, isLoading: usersLoading } = useGetUsersQuery();
    const [addDinner, { isLoading, isSuccess, error }] = usePutDinnerMutation();

    const isEditMode = Boolean(dinner);

    const { control, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: {
            id: dinner?.id ? String(dinner.id) : '',
            hostUserId: dinner ? String(dinner.hostUserId) : '',
            date: dinner?.date ?? '',
            food: dinner?.food ?? '',
            filmTitle: dinner?.filmTitle ?? '',
            filmImdbUrl: dinner?.filmImdbUrl ?? '',
            participants: dinner?.participantIds?.map((id) => String(id)) ?? [],
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
                participantIds: data.participants.map((id) => Number(id)),
            };

            await addDinner(formDinner).unwrap();
            reset();
        } catch (err) {
            console.error(err);
        }
    };

    if (usersLoading) return <p>Laster brukere...</p>;

    return (
        <div className="p-4 border rounded-xl shadow-md w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">Ny middag</h2>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-3"
            >
                {/* Hidden ID field for edit mode */}
                {isEditMode && (
                    <Controller
                        name="id"
                        control={control}
                        render={({ field }) => (
                            <input type="hidden" {...field} />
                        )}
                    />
                )}

                {/* Host */}
                <Controller
                    name="hostUserId"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <select
                            {...field}
                            className="border p-2 rounded"
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

                {/* Date */}
                <Controller
                    name="date"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <input
                            type="date"
                            {...field}
                            className="border p-2 rounded"
                            required
                        />
                    )}
                />

                {/* Food */}
                <Controller
                    name="food"
                    control={control}
                    render={({ field }) => (
                        <input
                            type="text"
                            {...field}
                            placeholder="Mat"
                            className="border p-2 rounded"
                        />
                    )}
                />

                {/* Film title */}
                <Controller
                    name="filmTitle"
                    control={control}
                    render={({ field }) => (
                        <input
                            type="text"
                            {...field}
                            placeholder="Filmtittel"
                            className="border p-2 rounded"
                        />
                    )}
                />

                {/* Film imdb url */}
                <Controller
                    name="filmImdbUrl"
                    control={control}
                    render={({ field }) => (
                        <input
                            type="text"
                            {...field}
                            placeholder="Lenke til IMDB"
                            className="border p-2 rounded"
                        />
                    )}
                />

                {/* Participants Multi-Select */}
                <Controller
                    name="participants"
                    control={control}
                    render={({ field }) => (
                        <>
                            <label className="font-bold">Hvem møtte opp?</label>
                            <div className="flex flex-col gap-1 border p-2 rounded h-40 overflow-y-auto">
                                {users?.map((user) => (
                                    <label
                                        key={user.id}
                                        className="flex items-center gap-2"
                                    >
                                        <input
                                            type="checkbox"
                                            value={user.id}
                                            checked={field.value.includes(
                                                String(user.id)
                                            )}
                                            onChange={(event) => {
                                                const id = String(user.id);
                                                if (event.target.checked) {
                                                    field.onChange([
                                                        ...field.value,
                                                        id,
                                                    ]);
                                                } else {
                                                    field.onChange(
                                                        field.value.filter(
                                                            (value: string) =>
                                                                value !== id
                                                        )
                                                    );
                                                }
                                            }}
                                            className="form-checkbox"
                                        />
                                        {user.name}
                                    </label>
                                ))}
                            </div>
                        </>
                    )}
                />

                <button
                    type="submit"
                    className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                    disabled={isLoading}
                >
                    {isLoading
                        ? 'Lagrer...'
                        : isEditMode
                          ? 'Oppdater middag'
                          : 'Legg til middag'}
                </button>

                {isSuccess && (
                    <p className="text-green-600">
                        Middag {isEditMode ? 'oppdatert' : 'lagt til'}!
                    </p>
                )}

                {error && (
                    <p className="text-red-600">
                        Klarte ikke {isEditMode ? 'oppdatere' : 'legge til'}{' '}
                        middag :(
                    </p>
                )}
            </form>
        </div>
    );
};

export default DinnerForm;
