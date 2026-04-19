import { differenceInWeeks, isPast } from 'date-fns';
import { SquarePen } from 'lucide-react';

import type { Rating } from '@/services/rating';

interface Props {
    dinnerId: number;
    dinnerDate: Date;
    rating: Rating;
}

const RatingCard = ({ dinnerId, dinnerDate, rating }: Props) => (
    <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm">
        <div className="mb-2 uppercase text-zinc-500">Din rating</div>
        <div className=" flex items-center justify-between">
            <span className="text-sm">
                <span className="font-bold text-zinc-900">Middag:</span>{' '}
                {rating.dinnerScore ? `${String(rating.dinnerScore)}/10` : '–'}
            </span>

            <span className="text-sm">
                <span className="font-bold text-zinc-900">Film:</span>{' '}
                {rating.filmScore}/10
            </span>

            <div className="flex items-center gap-1">
                {differenceInWeeks(new Date(), dinnerDate) <= 1 &&
                    isPast(dinnerDate) && (
                        <a
                            href={`/middag/${String(dinnerId)}/rating/${String(
                                rating.id
                            )}/rediger`}
                            title="Rediger rating"
                            aria-label="Rediger rating"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-200 text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-900"
                        >
                            <SquarePen size={16} />
                        </a>
                    )}
            </div>
        </div>
    </div>
);

export default RatingCard;
