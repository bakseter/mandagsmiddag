import { Plus } from 'lucide-react';

import { useGetPenaltiesQuery } from '@/api/penalty';
import { useGetUsersQuery, type User } from '@/api/user';
import AdminOnly from '@/components/admin-only';

const getUserById = (users: User[], id: number): User | null =>
    users.find((user) => user.id === id) ?? null;

const AdminPenaltyPage = () => {
    const { data: users = [], isLoading: usersLoading } = useGetUsersQuery({});
    const { data: penalties = [], isLoading: penaltiesLoading } =
        useGetPenaltiesQuery();

    if (usersLoading || penaltiesLoading) {
        return (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
                Laster ekstrapoeng...
            </div>
        );
    }

    return (
        <AdminOnly>
            <div className="space-y-8">
                <section className="space-y-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                        Ekstrapoeng
                    </h1>
                    <p className="max-w-3xl text-sm leading-6 text-zinc-600">
                        Legg til bonus- eller trekk-poeng for et medlem. Positivt
                        tall = bonus, negativt tall = trekk.
                    </p>
                </section>

                <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                    <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-4">
                        <h2 className="text-lg font-semibold text-zinc-900">
                            Medlemmer
                        </h2>
                    </div>

                    <div className="px-5 py-4">
                        {users.length === 0 ? (
                            <p className="text-sm text-zinc-500">
                                Ingen medlemmer funnet.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-separate border-spacing-y-2">
                                    <thead>
                                        <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                                            <th className="pb-2 font-medium">
                                                Navn
                                            </th>
                                            <th className="pb-2 text-right font-medium">
                                                Handling
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {users.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="rounded-xl bg-zinc-50 text-sm text-zinc-700"
                                            >
                                                <td className="rounded-l-xl px-4 py-3 font-medium text-zinc-900">
                                                    {user.name}
                                                </td>

                                                <td className="rounded-r-xl px-4 py-3">
                                                    <div className="flex justify-end">
                                                        <a
                                                            href={`/admin/penalty/ny?userId=${String(user.id)}`}
                                                            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
                                                        >
                                                            <Plus size={16} />
                                                            Legg til
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                    <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-4">
                        <h2 className="text-lg font-semibold text-zinc-900">
                            Historikk
                        </h2>
                    </div>

                    <div className="px-5 py-4">
                        {penalties.length === 0 ? (
                            <p className="text-sm text-zinc-500">
                                Ingen ekstrapoeng registrert enda.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-separate border-spacing-y-2">
                                    <thead>
                                        <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                                            <th className="pb-2 font-medium">
                                                Medlem
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Poeng
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Begrunnelse
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Tildelt av
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Dato
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {penalties.map((penalty) => {
                                            const recipient = getUserById(
                                                users,
                                                penalty.userId
                                            );

                                            return (
                                                <tr
                                                    key={penalty.id}
                                                    className="rounded-xl bg-zinc-50 text-sm text-zinc-700"
                                                >
                                                    <td className="rounded-l-xl px-4 py-3 font-medium text-zinc-900">
                                                        {recipient?.name ??
                                                            '—'}
                                                    </td>

                                                    <td className="px-4 py-3 font-semibold tabular-nums">
                                                        <span
                                                            className={
                                                                penalty.points >
                                                                0
                                                                    ? 'text-emerald-600'
                                                                    : 'text-rose-600'
                                                            }
                                                        >
                                                            {penalty.points > 0
                                                                ? `+${String(penalty.points)}`
                                                                : String(
                                                                      penalty.points
                                                                  )}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        {penalty.reason}
                                                    </td>

                                                    <td className="px-4 py-3 text-zinc-500">
                                                        {penalty.assignedBy}
                                                    </td>

                                                    <td className="rounded-r-xl px-4 py-3 text-zinc-500">
                                                        {penalty.assignedAt}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AdminOnly>
    );
};

export default AdminPenaltyPage;
