import { useForm, Controller } from 'react-hook-form';
import { formatISO } from 'date-fns';
import { usePostDinnerMutation } from '../services/dinner';

type FormValues = {
  date: string;
  time: string;
  participants: string;
};

const AddDinnerForm = () => {
  const { handleSubmit, control, reset } = useForm<FormValues>();
  const [addDinner, { isLoading, isSuccess, error }] = usePostDinnerMutation();

  const onSubmit = async (data: FormValues) => {
    // Combine date + time into ISO string
    const dateTimeISO = formatISO(new Date(`${data.date}T${data.time}`));

    await addDinner({
      date: dateTimeISO,
      participants: data.participants.split(',').map((p) => p.trim()),
    });
    reset();
  };

  return (
    <div className="p-4 border rounded shadow-md w-full max-w-md">
      <h2 className="text-lg font-semibold mb-2">Add Dinner</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
        <Controller
          name="date"
          control={control}
          defaultValue=""
          rules={{ required: true }}
          render={({ field }) => (
            <input type="date" {...field} className="border p-2 rounded" />
          )}
        />
        <Controller
          name="time"
          control={control}
          defaultValue=""
          rules={{ required: true }}
          render={({ field }) => (
            <input type="time" {...field} className="border p-2 rounded" />
          )}
        />
        <Controller
          name="participants"
          control={control}
          defaultValue=""
          rules={{ required: true }}
          render={({ field }) => (
            <input
              {...field}
              placeholder="Participants (comma separated)"
              className="border p-2 rounded"
            />
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
