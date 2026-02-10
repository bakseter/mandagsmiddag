import { useForm, Controller } from "react-hook-form";
import { formatISO } from "date-fns";
import { useGetUsersQuery } from "../services/user";
import { usePostDinnerMutation, type Dinner } from "../services/dinner";

type FormValues = {
  host: string;
  date: string;
  food: string;
  film: string;
  participants: string[];
};

export const AddDinnerForm = () => {
  const { data: users, isLoading: usersLoading } = useGetUsersQuery();
  const [addDinner, { isLoading, isSuccess, error }] = usePostDinnerMutation();

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      date: "",
      food: "",
      film: "",
      participants: [],
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const dinner: Dinner = {
        host_user_id: Number(data.host),
        date: formatISO(new Date(data.date)),
        food: data.food,
        film_title: data.film,
        // TODO: add 
        // film_imdb_url: data.film_imdb_url,
        participant_ids: data.participants.map((id) => Number(id)),
      }

      await addDinner(dinner).unwrap();
      reset();
    } catch (err) {
      console.error(err);
    }
  };

  if (usersLoading) return <p>Loading users...</p>;

  return (
    <div className="p-4 border rounded-xl shadow-md w-full max-w-md">
      <h2 className="text-lg font-semibold mb-2">Add Dinner</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
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
                    <option value="">Select Host</option>
                    {users?.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.email}
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
              placeholder="Food"
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
            <div className="flex flex-col gap-1 border p-2 rounded h-40 overflow-y-auto">
              {users?.map((user) => (
                <label key={user.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={user.id}
                    checked={field.value.includes(String(user.id))}
                    onChange={(e) => {
                      const id = String(user.id);
                      if (e.target.checked) {
                        field.onChange([...field.value, id]);
                      } else {
                        field.onChange(
                          field.value.filter((v: string) => v !== id),
                        );
                      }
                    }}
                    className="form-checkbox"
                  />
                  {user.email}
                </label>
              ))}
            </div>
          )}
        />

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          Add Dinner
        </button>

        {isSuccess && <p className="text-green-600">Dinner added!</p>}
        {error && <p className="text-red-600">Error adding dinner</p>}
      </form>
    </div>
  );
};

export default AddDinnerForm;
