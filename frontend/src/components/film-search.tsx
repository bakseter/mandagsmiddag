import { Film, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
    type TmdbMovie,
    useLazyGetMovieExternalIdsQuery,
    useSearchMoviesQuery,
} from '@/api/tmdb';

interface Props {
    titleValue: string;
    urlValue: string;
    onTitleChange: (title: string) => void;
    onUrlChange: (url: string) => void;
}

const inputClassName =
    'w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

const useDebounced = (value: string, delay = 300) => {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebounced(value);
        }, delay);

        return () => {
            clearTimeout(timeout);
        };
    }, [value, delay]);

    return debounced;
};

const FilmSearch = ({
    titleValue,
    urlValue,
    onTitleChange,
    onUrlChange,
}: Props) => {
    const [query, setQuery] = useState(titleValue);
    const [isOpen, setIsOpen] = useState(false);

    const search = useDebounced(query).trim();

    const { data: results = [], isFetching: isSearching } =
        useSearchMoviesQuery(search, { skip: search.length < 2 });
    const [fetchExternalIds, { isFetching: isFetchingImdb }] =
        useLazyGetMovieExternalIdsQuery();

    const showDropdown = isOpen && search.length >= 2;

    const handleChange = (value: string) => {
        setQuery(value);
        onTitleChange(value);
        onUrlChange('');
        setIsOpen(true);
    };

    const handleSelect = async ({ id, title }: TmdbMovie) => {
        setQuery(title);
        onTitleChange(title);
        setIsOpen(false);

        const { data: externalIds } = await fetchExternalIds(id);
        onUrlChange(
            externalIds?.imdbId
                ? `https://www.imdb.com/title/${externalIds.imdbId}/`
                : ''
        );
    };

    const handleClear = () => {
        setQuery('');
        onTitleChange('');
        onUrlChange('');
        setIsOpen(false);
    };

    return (
        <div className="grid gap-5 md:grid-cols-2">
            <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-800">
                    Filmtittel
                </label>

                <div
                    className="relative"
                    onFocus={() => {
                        setIsOpen(true);
                    }}
                    onBlur={(event) => {
                        if (
                            !event.currentTarget.contains(event.relatedTarget)
                        ) {
                            setIsOpen(false);
                        }
                    }}
                >
                    <input
                        type="text"
                        value={query}
                        onChange={(event) => {
                            handleChange(event.target.value);
                        }}
                        placeholder="For eksempel Interstellar"
                        className={inputClassName}
                        autoComplete="off"
                    />

                    {query && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 hover:text-zinc-700"
                            aria-label="Fjern valgt film"
                        >
                            <X size={14} />
                        </button>
                    )}

                    {showDropdown && (
                        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-md">
                            {isSearching && (
                                <div className="px-3 py-3 text-center text-sm text-zinc-400">
                                    Søker…
                                </div>
                            )}

                            {!isSearching && results.length === 0 && (
                                <div className="px-3 py-3 text-center text-sm text-zinc-400">
                                    Ingen treff funnet
                                </div>
                            )}

                            {!isSearching &&
                                results.map((movie) => (
                                    <button
                                        key={movie.id}
                                        type="button"
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                        }}
                                        onClick={() => {
                                            // eslint-disable-next-line @typescript-eslint/no-floating-promises
                                            handleSelect(movie);
                                        }}
                                        className="flex w-full items-center gap-3 border-b border-zinc-100 px-3 py-2 text-left last:border-b-0 hover:bg-zinc-50 focus:bg-zinc-50 focus:outline-none"
                                    >
                                        {movie.posterPath ? (
                                            <img
                                                src={`${TMDB_IMAGE_BASE}${movie.posterPath}`}
                                                alt=""
                                                className="h-10 w-7 flex-shrink-0 rounded object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <Film />
                                        )}

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-zinc-900">
                                                {movie.title}
                                            </p>
                                            {movie.releaseDate && (
                                                <p className="text-xs text-zinc-400">
                                                    {movie.releaseDate.slice(
                                                        0,
                                                        4
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-800">
                    IMDb-lenke
                </label>
                <input
                    type="text"
                    value={isFetchingImdb ? 'Henter IMDb-lenke…' : urlValue}
                    readOnly
                    placeholder="Fylles ut automatisk"
                    className={`${inputClassName} cursor-default bg-zinc-200 text-zinc-500`}
                />
            </div>
        </div>
    );
};

export default FilmSearch;
