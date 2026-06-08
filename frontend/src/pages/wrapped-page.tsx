import { format, isPast } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useEffect, useMemo, useRef, useState } from 'react';

import { type Dinner, useGetDinnersQuery } from '@/services/dinner';
import { type Rating, useGetRatingsQuery } from '@/services/rating';
import { useGetUsersQuery, type User } from '@/services/user';

// ─── Font ──────────────────────────────────────────────────────────────────────

const FONT_HREF =
    'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap';

const useGoogleFont = (href: string) => {
    useEffect(() => {
        if (document.querySelector(`link[href="${href}"]`)) {
            return;
        }
        const link = Object.assign(document.createElement('link'), {
            rel: 'stylesheet',
            href,
        });
        document.head.appendChild(link);
    }, [href]);
};

// ─── Hooks ─────────────────────────────────────────────────────────────────────

const useInView = (threshold = 0.35) => {
    const ref = useRef<HTMLElement>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                }
            },
            { threshold }
        );
        observer.observe(el);
        /* eslint-disable consistent-return */
        return () => {
            observer.disconnect();
        };
        /* eslint-enable consistent-return */
    }, [threshold]);

    return { ref, inView };
};

// ─── Pure helpers ──────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

const getAverage = (numbers: number[]) =>
    numbers.length === 0
        ? 0
        : numbers.reduce((sum, number) => sum + number, 0) / numbers.length;

const getFirstName = (name: string) => name.split(' ')[0];

const groupBy = <T,>(
    items: T[],
    getKey: (item: T) => number
): Record<number, T[]> =>
    items.reduce<Record<number, T[]>>((accumulator, item) => {
        const key = getKey(item);
        return { ...accumulator, [key]: [...(accumulator[key] ?? []), item] };
    }, {});

const getUserById = (users: User[], userId: number) =>
    users.find((user) => user.id === userId) ?? null;

// ─── Stats computation (pure, memoised) ───────────────────────────────────────

const computeStats = (dinners: Dinner[], ratings: Rating[], users: User[]) => {
    const pastDinners = dinners
        .filter((dinner) => isPast(new Date(dinner.date)))
        .sort(
            (dinnerA, dinnerB) =>
                new Date(dinnerA.date).getTime() -
                new Date(dinnerB.date).getTime()
        );

    // ── Points: 1 for film always + 1 for food if rated or if you were the host ─
    const hostUserIds = new Set(pastDinners.map((dinner) => dinner.hostUserId));

    const pointsByUserId = ratings.reduce<Record<number, number>>(
        (accumulator, rating) => {
            const currentPoints = accumulator[rating.userId] ?? 0;
            const filmPoints = currentPoints + 1;
            const isHost = hostUserIds.has(rating.userId);
            const earnedFoodPoint = rating.dinnerScore !== null || isHost;

            return {
                ...accumulator,
                [rating.userId]: earnedFoodPoint ? filmPoints + 1 : filmPoints,
            };
        },
        {}
    );

    const podium = Object.entries(pointsByUserId)
        .flatMap(([userId, points]) => {
            const user = getUserById(users, Number(userId));
            return user ? [{ user, points }] : [];
        })
        .sort((entryA, entryB) => entryB.points - entryA.points);

    // ── Dinner scores grouped by dinner ───────────────────────────────────────
    const ratingsWithDinnerScore = ratings.flatMap((rating) =>
        rating.dinnerScore === null
            ? []
            : [{ ...rating, dinnerScore: rating.dinnerScore }]
    );

    const dinnerScoresByDinnerId = groupBy(
        ratingsWithDinnerScore,
        (rating) => rating.dinnerId
    );

    const bestDinners = pastDinners
        .filter(
            (dinner) => dinner.food && dinnerScoresByDinnerId[dinner.id]?.length // eslint-disable-line @typescript-eslint/no-unnecessary-condition
        )
        .map((dinner) => ({
            dinner,
            averageScore: getAverage(
                dinnerScoresByDinnerId[dinner.id].map(
                    (rating) => rating.dinnerScore
                )
            ),
            hostName: getUserById(users, dinner.hostUserId)?.name ?? 'Ukjent',
        }))
        .sort((dinnerA, dinnerB) => dinnerB.averageScore - dinnerA.averageScore)
        .slice(0, 5);

    // ── Film scores grouped by dinner ─────────────────────────────────────────
    const filmScoresByDinnerId = groupBy(ratings, (rating) => rating.dinnerId);

    const bestFilms = pastDinners
        .filter(
            (dinner) =>
                dinner.filmTitle && filmScoresByDinnerId[dinner.id]?.length // eslint-disable-line @typescript-eslint/no-unnecessary-condition
        )
        .map((dinner) => ({
            dinner,
            averageScore: getAverage(
                filmScoresByDinnerId[dinner.id].map(
                    (rating) => rating.filmScore
                )
            ),
        }))
        .sort((filmA, filmB) => filmB.averageScore - filmA.averageScore)
        .slice(0, 5);

    // ── Attendance ────────────────────────────────────────────────────────────
    const attendanceCountByUserId = pastDinners
        .flatMap((dinner) => dinner.participantIds ?? [])
        .reduce<Record<number, number>>(
            (accumulator, userId) => ({
                ...accumulator,
                [userId]: (accumulator[userId] ?? 0) + 1,
            }),
            {}
        );

    const topAttendee =
        Object.entries(attendanceCountByUserId)
            .flatMap(([userId, count]) => {
                const user = getUserById(users, Number(userId));
                return user ? [{ user, count }] : [];
            })
            .sort((entryA, entryB) => entryB.count - entryA.count)[0] ?? null;

    // ── Global averages ───────────────────────────────────────────────────────
    const allDinnerScores = ratings.flatMap((rating) =>
        rating.dinnerScore === null ? [] : [rating.dinnerScore]
    );
    const allFilmScores = ratings.map((rating) => rating.filmScore);
    const averageDinnerScore = getAverage(allDinnerScores);
    const averageFilmScore = getAverage(allFilmScores);

    // ── Worst film ────────────────────────────────────────────────────────────
    const worstFilmScore = allFilmScores.length
        ? Math.min(...allFilmScores)
        : 0;
    const worstFilmRating = ratings.find(
        (rating) => rating.filmScore === worstFilmScore
    );
    const worstFilmDinner =
        dinners.find((dinner) => dinner.id === worstFilmRating?.dinnerId) ??
        null;

    // ── Biggest film fan (most 10s given on film) ─────────────────────────────
    const filmTenCountByUserId = ratings
        .filter((rating) => rating.filmScore === 10)
        .reduce<Record<number, number>>(
            (accumulator, rating) => ({
                ...accumulator,
                [rating.userId]: (accumulator[rating.userId] ?? 0) + 1,
            }),
            {}
        );

    const biggestFilmFan =
        Object.entries(filmTenCountByUserId)
            .flatMap(([userId, count]) => {
                const user = getUserById(users, Number(userId));
                return user ? [{ user, count }] : [];
            })
            .sort((entryA, entryB) => entryB.count - entryA.count)[0] ?? null;

    // ── Most generous dinner rater (highest avg dinner score given) ───────────
    const dinnerScoresByRater = groupBy(
        ratingsWithDinnerScore,
        (rating) => rating.userId
    );

    const mostGenerousRater =
        Object.entries(dinnerScoresByRater)
            .flatMap(([userId, userRatings]) => {
                const user = getUserById(users, Number(userId));
                return user
                    ? [
                          {
                              user,
                              averageGiven: getAverage(
                                  userRatings.map(
                                      (rating) => rating.dinnerScore
                                  )
                              ),
                              ratingCount: userRatings.length,
                          },
                      ]
                    : [];
            })
            .filter((entry) => entry.ratingCount >= 3)
            .sort(
                (raterA, raterB) => raterB.averageGiven - raterA.averageGiven
            )[0] ?? null;

    // ── Biggest score split on a single dinner ────────────────────────────────
    const mostControversialDinner =
        pastDinners
            .map((dinner) => {
                const scores = (dinnerScoresByDinnerId[dinner.id] ?? []).map(
                    (rating) => rating.dinnerScore
                );
                return {
                    dinner,
                    gap:
                        scores.length >= 2
                            ? Math.max(...scores) - Math.min(...scores)
                            : 0,
                };
            })
            .filter((entry) => entry.gap > 0)
            .sort((entryA, entryB) => entryB.gap - entryA.gap)[0] ?? null;

    // ── Longest consecutive attendance streak ─────────────────────────────────
    const streakByUser = users.map((user) => {
        const streakLength = pastDinners.reduce(
            (accumulator, dinner) => {
                const attended = (dinner.participantIds ?? []).includes(
                    user.id
                );
                return {
                    current: attended ? accumulator.current + 1 : 0,
                    best: attended
                        ? Math.max(accumulator.best, accumulator.current + 1)
                        : accumulator.best,
                };
            },
            { current: 0, best: 0 }
        ).best;
        return { user, streakLength };
    });

    const longestStreak =
        streakByUser
            .filter((entry) => entry.streakLength > 0)
            .sort(
                (entryA, entryB) => entryB.streakLength - entryA.streakLength
            )[0] ?? null;

    // ── Most consistent food rater (lowest score variance, min 3 ratings) ─────
    const mostConsistentRater =
        Object.entries(dinnerScoresByRater)
            .flatMap(([userId, userRatings]) => {
                const user = getUserById(users, Number(userId));
                const scores = userRatings.map((rating) => rating.dinnerScore);
                const mean = getAverage(scores);
                const variance = getAverage(
                    scores.map((score) => (score - mean) ** 2)
                );
                return user
                    ? [{ user, variance, ratingCount: scores.length }]
                    : [];
            })
            .filter((entry) => entry.ratingCount >= 3)
            .sort((entryA, entryB) => entryA.variance - entryB.variance)[0] ??
        null;

    // ── Biggest dinner (most attendees at a single dinner) ────────────────────
    const biggestDinner =
        pastDinners
            .map((dinner) => ({
                dinner,
                attendeeCount: (dinner.participantIds ?? []).length,
            }))
            .filter((entry) => entry.attendeeCount > 0)
            .sort(
                (entryA, entryB) => entryB.attendeeCount - entryA.attendeeCount
            )[0] ?? null;

    return {
        pastDinners,
        podium,
        bestDinners,
        bestFilms,
        topAttendee,
        averageDinnerScore,
        averageFilmScore,
        worstFilmScore,
        worstFilmDinner,
        biggestFilmFan,
        mostGenerousRater,
        mostControversialDinner,
        longestStreak,
        mostConsistentRater,
        biggestDinner,
        totalRatings: ratings.length,
        uniqueParticipantCount: new Set(ratings.map((rating) => rating.userId))
            .size,
    };
};

// ─── Sub-components ────────────────────────────────────────────────────────────

interface SlideProps {
    children: React.ReactNode;
    className?: string;
}

const Slide = ({ children, className = '' }: SlideProps) => {
    const { ref, inView } = useInView();
    return (
        <section
            ref={ref}
            className={[
                'min-h-screen flex flex-col justify-center items-center px-6 py-20',
                'transition-all duration-700 ease-out',
                inView
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8',
                className,
            ].join(' ')}
        >
            {children}
        </section>
    );
};

interface CounterProps {
    target: number;
    suffix?: string;
}

const Counter = ({ target, suffix = '' }: CounterProps) => {
    const [value, setValue] = useState(0);
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) {
            return;
        }
        hasRun.current = true;
        const step = Math.max(1, Math.ceil(target / 40));
        const timer = setInterval(() => {
            setValue((previous) => {
                const next = Math.min(previous + step, target);
                if (next >= target) {
                    clearInterval(timer);
                }
                return next;
            });
        }, 30);
    }, [target]);

    return (
        <>
            {value}
            {suffix}
        </>
    );
};

interface StatCardProps {
    label: string;
    value: number;
    suffix?: string;
    delay?: number;
}

const StatCard = ({ label, value, suffix = '', delay = 0 }: StatCardProps) => {
    const { ref, inView } = useInView(0.5);
    return (
        <div
            ref={ref as React.RefObject<HTMLDivElement>}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm text-center transition-all duration-500"
            style={{ transitionDelay: `${String(delay)}ms` }}
        >
            <div className="text-4xl font-semibold tracking-tight text-zinc-900">
                {inView ? (
                    <Counter target={value} suffix={suffix} />
                ) : (
                    `0${suffix}`
                )}
            </div>
            <div className="mt-1 text-sm text-zinc-500">{label}</div>
        </div>
    );
};

interface BarRowProps {
    label: string;
    sub: string;
    score: number;
    delay: number;
    animate: boolean;
}

const BarRow = ({ label, sub, score, delay, animate }: BarRowProps) => {
    const fillRef = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (!animate || hasAnimated.current || !fillRef.current) {
            return;
        }
        hasAnimated.current = true;
        const fillElement = fillRef.current;
        setTimeout(() => {
            fillElement.style.width = `${String((score / 10) * 100)}%`;
        }, delay);
    }, [animate, score, delay]);

    return (
        <div>
            <div className="flex items-baseline justify-between mb-1.5">
                <div>
                    <span className="text-sm font-medium text-zinc-900">
                        {label}
                    </span>
                    <span className="ml-2 text-xs text-zinc-400">{sub}</span>
                </div>
                <span className="text-sm font-semibold text-zinc-900 tabular-nums">
                    {score.toFixed(1)}
                </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                <div
                    ref={fillRef}
                    className="h-full rounded-full bg-zinc-900 transition-[width] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ width: 0 }}
                />
            </div>
        </div>
    );
};

const PODIUM_HEIGHT_CLASSES = ['h-36', 'h-24', 'h-16'] as const;
const PODIUM_AVATAR_CLASSES = [
    'bg-zinc-900 text-white',
    'bg-zinc-200 text-zinc-700',
    'bg-zinc-100 text-zinc-500',
] as const;
const PODIUM_ORDER_CLASSES = ['order-2', 'order-1', 'order-3'] as const;

interface PodiumColProps {
    entry: { user: User; points: number };
    rank: 1 | 2 | 3;
}

const PodiumCol = ({ entry, rank }: PodiumColProps) => (
    <div
        className={`flex flex-col items-center gap-2 flex-1 ${PODIUM_ORDER_CLASSES[rank - 1]}`}
    >
        <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${PODIUM_AVATAR_CLASSES[rank - 1]}`}
        >
            {getInitials(entry.user.name)}
        </div>
        <div className="text-sm font-medium text-zinc-900 text-center leading-tight">
            {getFirstName(entry.user.name)}
        </div>
        <div className="text-xs text-zinc-500">{entry.points} pts</div>
        <div
            className={`w-full ${PODIUM_HEIGHT_CLASSES[rank - 1]} rounded-t-xl border border-zinc-200 bg-white shadow-sm flex items-center justify-center`}
        >
            <span
                className={`font-semibold ${rank === 1 ? 'text-2xl text-zinc-900' : 'text-lg text-zinc-400'}`}
            >
                {rank}
            </span>
        </div>
    </div>
);

interface FactCardProps {
    label: string;
    value: string;
    accent?: boolean;
}

const FactCard = ({ label, value, accent = false }: FactCardProps) => (
    <div
        className={[
            'rounded-2xl border p-5 shadow-sm',
            accent
                ? 'border-zinc-900 bg-zinc-900 text-white'
                : 'border-zinc-200 bg-white text-zinc-900',
        ].join(' ')}
    >
        <div
            className={`text-3xl font-semibold tracking-tight leading-none mb-2 ${accent ? 'text-white' : 'text-zinc-900'}`}
        >
            {value}
        </div>
        <div
            className={`text-sm leading-snug ${accent ? 'text-zinc-400' : 'text-zinc-500'}`}
        >
            {label}
        </div>
    </div>
);

const SerifItalic = ({ children }: { children: React.ReactNode }) => (
    <span
        style={{ fontFamily: "'DM Serif Display', serif" }}
        className="italic"
    >
        {children}
    </span>
);

const SlideHeader = ({
    eyebrow,
    title,
}: {
    eyebrow: string;
    title: React.ReactNode;
}) => (
    <div className="text-center space-y-2">
        <p className="text-xs tracking-[0.2em] uppercase text-zinc-400">
            {eyebrow}
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            {title}
        </h2>
    </div>
);

// ─── Page ──────────────────────────────────────────────────────────────────────

const WrappedPage = () => {
    useGoogleFont(FONT_HREF);

    const { data: dinners = [], isLoading: dinnersLoading } =
        useGetDinnersQuery();
    const { data: ratings = [], isLoading: ratingsLoading } =
        useGetRatingsQuery();
    const { data: users = [], isLoading: usersLoading } = useGetUsersQuery();

    const [isFoodSlideVisible, setIsFoodSlideVisible] = useState(false);
    const foodSlideRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = foodSlideRef.current;
        if (!element) {
            return;
        }
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsFoodSlideVisible(true);
                }
            },
            { threshold: 0.35 }
        );
        observer.observe(element);

        /* eslint-disable consistent-return */
        return () => {
            observer.disconnect();
        };
        /* eslint-enable consistent-return */
    }, []);

    const stats = useMemo(
        () => computeStats(dinners, ratings, users),
        [dinners, ratings, users]
    );

    if (dinnersLoading || ratingsLoading || usersLoading) {
        return (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
                Laster sommerfest wrapped...
            </div>
        );
    }

    const [firstPlace, secondPlace, thirdPlace] = stats.podium;
    const mvp = firstPlace;

    return (
        <div className="bg-white">
            {/* ── HERO ────────────────────────────────────────────── */}
            <Slide className="text-center gap-4 relative overflow-hidden border-b border-zinc-100">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />
                <p className="text-xs tracking-[0.25em] uppercase text-zinc-400">
                    Sommer 2026
                </p>
                <h1 className="text-[clamp(52px,10vw,100px)] leading-[0.95] font-semibold tracking-tighter text-zinc-900">
                    Mandags-
                    <br />
                    <SerifItalic>
                        <span className="text-zinc-400">middag</span>
                    </SerifItalic>
                    <br />
                    Wrapped
                </h1>
                <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
                    Alle kveldene. Alle filmene. Én klar vinner.
                </p>
                <div className="mt-8 flex flex-col items-center gap-1 text-xs text-zinc-300 tracking-widest uppercase animate-bounce">
                    scroll
                    <div className="w-px h-8 bg-gradient-to-b from-zinc-300 to-transparent" />
                </div>
            </Slide>

            {/* ── SEASON STATS ────────────────────────────────────── */}
            <Slide>
                <div className="w-full max-w-xl space-y-10">
                    <SlideHeader
                        eyebrow="Sesongen i tall"
                        title={
                            <>
                                Det har vært et{' '}
                                <SerifItalic>travelt</SerifItalic> halvår
                            </>
                        }
                    />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <StatCard
                            label="Middager"
                            value={stats.pastDinners.length}
                            delay={0}
                        />
                        <StatCard
                            label="Filmer sett"
                            value={stats.pastDinners.length}
                            delay={80}
                        />
                        <StatCard
                            label="Ratinger"
                            value={stats.totalRatings}
                            delay={160}
                        />
                        <StatCard
                            label="Deltakere"
                            value={stats.uniqueParticipantCount}
                            delay={240}
                        />
                    </div>
                </div>
            </Slide>

            {/* ── PODIUM ──────────────────────────────────────────── */}
            <Slide>
                <div className="w-full max-w-sm space-y-10">
                    <SlideHeader
                        eyebrow="Poengstilling"
                        title={
                            <>
                                Topp <SerifItalic>tre</SerifItalic>
                            </>
                        }
                    />
                    <p className="text-xs text-zinc-400 text-center -mt-6">
                        1 poeng per rating gitt
                    </p>
                    <div className="flex items-end gap-3">
                        <PodiumCol entry={secondPlace} rank={2} />
                        <PodiumCol entry={firstPlace} rank={1} />
                        <PodiumCol entry={thirdPlace} rank={3} />
                    </div>
                    {stats.podium.slice(3).length > 0 && (
                        <div className="space-y-2">
                            {stats.podium.slice(3).map((entry, index) => (
                                <div
                                    key={entry.user.id}
                                    className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-5 text-center text-xs text-zinc-400 font-medium">
                                            {index + 4}
                                        </span>
                                        <span className="font-medium text-zinc-900">
                                            {getFirstName(entry.user.name)}
                                        </span>
                                    </div>
                                    <span className="text-zinc-500">
                                        {entry.points} pts
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Slide>

            {/* ── BEST DINNERS ────────────────────────────────────── */}
            <section
                ref={foodSlideRef}
                className={[
                    'min-h-screen flex flex-col justify-center items-center px-6 py-20',
                    'transition-all duration-700 ease-out',
                    isFoodSlideVisible
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-8',
                ].join(' ')}
            >
                <div className="w-full max-w-xl space-y-10">
                    <SlideHeader
                        eyebrow="Matratinger"
                        title={
                            <>
                                Beste <SerifItalic>middager</SerifItalic>
                            </>
                        }
                    />
                    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm divide-y divide-zinc-100">
                        {stats.bestDinners.map(
                            ({ dinner, averageScore, hostName }, index) => (
                                <div
                                    key={dinner.id}
                                    className="px-5 py-4 flex items-center gap-4"
                                >
                                    <span className="text-sm font-medium text-zinc-300 w-5 text-center shrink-0">
                                        {index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <BarRow
                                            label={dinner.food ?? ''}
                                            sub={`av ${hostName}`}
                                            score={averageScore}
                                            delay={index * 120}
                                            animate={isFoodSlideVisible}
                                        />
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </section>

            {/* ── BEST FILMS ──────────────────────────────────────── */}
            <Slide>
                <div className="w-full max-w-xl space-y-10">
                    <SlideHeader
                        eyebrow="Filmratinger"
                        title={
                            <>
                                Filmenes <SerifItalic>dom</SerifItalic>
                            </>
                        }
                    />
                    <div className="space-y-3">
                        {stats.bestFilms.map(
                            ({ dinner, averageScore }, index) => (
                                <div
                                    key={dinner.id}
                                    className={[
                                        'flex items-center gap-4 rounded-2xl border px-5 py-4 bg-white shadow-sm',
                                        index === 0
                                            ? 'border-zinc-900'
                                            : 'border-zinc-200',
                                    ].join(' ')}
                                >
                                    <span
                                        className={`text-sm font-semibold w-6 text-center shrink-0 ${index === 0 ? 'text-zinc-900' : 'text-zinc-300'}`}
                                    >
                                        {index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        {dinner.filmImdbUrl ? (
                                            <a
                                                href={dinner.filmImdbUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium text-sky-700 underline-offset-4 hover:underline truncate block"
                                            >
                                                {dinner.filmTitle}
                                            </a>
                                        ) : (
                                            <span className="text-sm font-medium text-zinc-900 truncate block">
                                                {dinner.filmTitle}
                                            </span>
                                        )}
                                        <span className="text-xs text-zinc-400">
                                            {format(
                                                new Date(dinner.date),
                                                'dd. MMM',
                                                { locale: nb }
                                            )}
                                        </span>
                                    </div>
                                    <span className="text-sm font-semibold text-zinc-900 tabular-nums shrink-0">
                                        {averageScore.toFixed(1)}
                                    </span>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </Slide>

            {/* ── MVP ─────────────────────────────────────────────── */}
            <Slide className="text-center relative overflow-hidden">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle, #000 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />
                <div className="space-y-5 max-w-xs">
                    <p className="text-xs tracking-[0.2em] uppercase text-zinc-400">
                        Sesongens MVP
                    </p>
                    <div className="mx-auto w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center text-white text-2xl font-semibold">
                        {getInitials(mvp.user.name)}
                    </div>
                    <h2 className="text-[clamp(40px,10vw,80px)] font-semibold tracking-tighter text-zinc-900 leading-none">
                        {getFirstName(mvp.user.name)}
                    </h2>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        Flest poeng, alltid til stede, og aldri en kjedelig
                        kveld.
                    </p>
                    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm">
                        {mvp.points} poeng denne sesongen
                    </div>
                </div>
            </Slide>

            {/* ── FUN FACTS ───────────────────────────────────────── */}
            <Slide>
                <div className="w-full max-w-xl space-y-10">
                    <SlideHeader
                        eyebrow="Visste du at..."
                        title={
                            <>
                                Litt <SerifItalic>statistikk</SerifItalic>
                            </>
                        }
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <FactCard
                            value={stats.averageDinnerScore.toFixed(1)}
                            label="Snittrating på mat denne sesongen"
                            accent
                        />
                        <FactCard
                            value={stats.averageFilmScore.toFixed(1)}
                            label="Snittrating på film denne sesongen"
                        />
                        <FactCard
                            value={`${String(stats.topAttendee.count)}/${String(stats.pastDinners.length)}`}
                            label={`${stats.topAttendee.user.name} møtte opp flest ganger`}
                        />
                        <FactCard
                            value={String(stats.longestStreak.streakLength)}
                            label={`${stats.longestStreak.user.name} hadde lengste møtestreak på rad`}
                            accent
                        />
                        <FactCard
                            value={stats.biggestFilmFan.user.name}
                            label={`Delte ut flest 10-ere på film (${String(stats.biggestFilmFan.count)} stk)`}
                        />
                        <FactCard
                            value={stats.mostGenerousRater.averageGiven.toFixed(
                                1
                            )}
                            label={`${stats.mostGenerousRater.user.name} var sesongens snilleste matkritiker`}
                            accent
                        />
                        <FactCard
                            value={`±${String(stats.mostControversialDinner.gap)}`}
                            label={`Størst sprik på én middag — ${stats.mostControversialDinner.dinner.food ?? ''}`}
                        />
                        <FactCard
                            value={
                                stats.worstFilmScore > 0
                                    ? stats.worstFilmScore.toFixed(1)
                                    : '-'
                            }
                            label={`Laveste filmrating — ${stats.worstFilmDinner?.filmTitle ?? 'ukjent film'}`}
                            accent
                        />
                        <FactCard
                            value={stats.mostConsistentRater.user.name}
                            label="Mest konsistent matkritiker — minst variasjon i karakterene"
                        />
                        <FactCard
                            value={String(stats.biggestDinner.attendeeCount)}
                            label={`Flest på én middag — ${stats.biggestDinner.dinner.food ?? ''}`}
                            accent
                        />
                    </div>
                </div>
            </Slide>

            {/* ── OUTRO ───────────────────────────────────────────── */}
            <Slide className="text-center border-t border-zinc-100">
                <div className="space-y-6 max-w-sm">
                    <h2 className="text-[clamp(48px,10vw,88px)] font-semibold tracking-tighter text-zinc-900 leading-none">
                        Vi gjør det{' '}
                        <SerifItalic>
                            <span className="text-zinc-400">igjen</span>
                        </SerifItalic>
                    </h2>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        Sesongen fortsetter! Sørg for at du er klar med en
                        banger middag.
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
                    >
                        ← Tilbake til oversikten
                    </a>
                </div>
            </Slide>
        </div>
    );
};

export default WrappedPage;
