import { Controller, useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router';

import { usePostPenaltyMutation } from '@/api/penalty';
import { useGetUsersQuery } from '@/api/user';
import FormSubmitStatus from '@/components/form-submit-status';

interface FormValues {
    userId: string;
    points: string;
    reason: string;
}

const inputClassName =
    'w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200';

const labelClassName = 'mb-1.5 block text-sm font-medium text-zinc-800';

const PenaltyForm = () => {
    const [searchParams] = useSearchParams();
    const preselectedUserId = searchParams.get('userId') ?? '';

    const { data: users, isLoading: usersLoading } = useGetUsersQuery({});

    const [
        postPenalty,
        { isLoading: isSubmitting, isSuccess: submittedSuccessfully, error },
    ] = usePostPenaltyMutation();

    const { handleSubmit, control, reset } = useForm<FormValues>({
        defaultValues: {
            userId: preselectedUserId,
            points: '',
            reason: '',
        },
    });

    if (usersLoading) {
        return <p>Laster brukere...</p>;
    }

    const onSubmit = async (data: FormValues) => {
        try {
            await postPenalty({
                userId: Number(data.userId),
                points: Number(data.points),
                reason: data.reason,
            }).unwrap();

            reset();
        } catch (error_) {
            // eslint-disable-next-line no-console
            console.error(error_);
        }
    };

    return (
        <div className="mt-4 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                    Registrer ekstrapoeng
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Positivt tall = bonus, negativt tall = trekk.
                </p>
            </div>

            {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                    <label className={labelClassName}>Mottaker</label>
                    <Controller
                        name="userId"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <select {...field} className={inputClassName}>
                                <option value="">Velg et medlem</option>
                                {users?.map((user) => (
                                    <option
                                        key={user.id}
                                        value={String(user.id)}
                                    >
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    />
                </div>

                <div>
                    <label className={labelClassName}>
                        Poeng (positivt = bonus, negativt = trekk)
                    </label>
                    <Controller
                        name="points"
                        control={control}
                        rules={{
                            required: true,
                            validate: (value) => {
                                const number = Number(value);
                                return (
                                    (Number.isInteger(number) &&
                                        number !== 0) ||
                                    'Må være et heltall som ikke er 0'
                                );
                            },
                        }}
                        render={({ field }) => (
                            <input
                                type="number"
                                {...field}
                                step={1}
                                placeholder="f.eks. 2 eller -1"
                                className={inputClassName}
                            />
                        )}
                    />
                </div>

                <div>
                    <label className={labelClassName}>Begrunnelse</label>
                    <Controller
                        name="reason"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <textarea
                                {...field}
                                rows={3}
                                placeholder="Beskriv hvorfor…"
                                className={inputClassName}
                            />
                        )}
                    />
                </div>

                <FormSubmitStatus
                    whatIsBeingSubmitted="Justering"
                    isEditMode={false}
                    isSubmitting={isSubmitting}
                    submittedSuccessfully={submittedSuccessfully}
                    error={error}
                />
            </form>
        </div>
    );
};

export default PenaltyForm;
