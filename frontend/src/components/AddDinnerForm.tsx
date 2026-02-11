import { Controller, useForm } from 'react-hook-form';
import { type Dinner, usePostDinnerMutation } from '../services/dinner';
import { formatISO } from 'date-fns';
import { useGetUsersQuery } from '../services/user';

interface FormValues {
    host: string;
    date: string;
    food: string;
    film: string;
    participants: string[];
}

const AddDinnerForm = () => {
    const { data: users, isLoading: usersLoading } = useGetUsersQuery();
    const [addDinner, { isLoading, isSuccess, error }] =
        usePostDinnerMutation();

    const { control, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: {
            date: '',
            food: '',
            film: '',
            participants: [],
        },
    });

    const onSubmit = async (data: FormValues) => {
        try {
            const dinner: Dinner = {
                hostUserId: Number(data.host),
                date: formatISO(new Date(data.date)),
                food: data.food,
                filmTitle: data.film,
                // TODO: add
                // Film_imdb_url: data.film_imdb_url,
                participantIds: data.participants.map((id) => Number(id)),
            };

            await addDinner(dinner).unwrap();
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
                {/* Host */}
                <Controller
                    name="host"
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
                    rules={{ required: true }}
                    render={({ field }) => (
                        <input
                            type="text"
                            {...field}
                            placeholder="Mat"
                            className="border p-2 rounded"
                            required
                        />
                    )}
                />

                {/* Film */}
                <Controller
                    name="film"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <input
                            type="text"
                            {...field}
                            placeholder="Film"
                            className="border p-2 rounded"
                            required
                        />
                    )}
                />

                {/* Participants Multi-Select */}
                <Controller
                    name="participants"
                    control={control}
                    rules={{ required: true }}
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
                    {isLoading ? 'Lagrer...' : 'Legg til middag'}
                </button>

                {isSuccess && (
                    <p className="text-green-600">Middag lagt til!</p>
                )}
                {error && (
                    <p className="text-red-600">
                        Klarte ikke legge til middag... :(
                    </p>
                )}
            </form>
        </div>
    );
};

export default AddDinnerForm;
