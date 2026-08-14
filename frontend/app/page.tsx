"use client";

import { useState } from "react";

import {
  searchSongs,
  getRecommendations,
  Song,
  Recommendation,
} from "@/lib/api";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [recommendations, setRecommendations] = useState<
    Recommendation[]
  >([]);

  const [searchLoading, setSearchLoading] = useState(false);
  const [recommendationLoading, setRecommendationLoading] =
    useState(false);

  const [error, setError] = useState("");

  // ============================================================
  // SEARCH
  // ============================================================

  async function handleSearch() {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    setSearchLoading(true);
    setError("");
    setRecommendations([]);
    setSelectedSong(null);

    try {
      const data = await searchSongs(trimmedQuery);

      setResults(data.results);

      if (data.results.length === 0) {
        setError("No songs found.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );

      setResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  // ============================================================
  // KEYBOARD SEARCH
  // ============================================================

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      handleSearch();
    }
  }

  // ============================================================
  // SELECT SONG + GET RECOMMENDATIONS
  // ============================================================

  async function handleSongSelect(song: Song) {
    setSelectedSong(song);
    setRecommendations([]);
    setError("");
    setRecommendationLoading(true);

    try {
      const data = await getRecommendations(song.name, 10);

      setRecommendations(data.recommendations);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate recommendations."
      );
    } finally {
      setRecommendationLoading(false);
    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="min-h-screen bg-[#080809] text-white">

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="text-xl font-semibold tracking-tight">
          SONORA
        </div>

        <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <a
            href="#how-it-works"
            className="transition hover:text-white"
          >
            How it works
          </a>

          <a
            href="#insights"
            className="transition hover:text-white"
          >
            Model Insights
          </a>
        </div>
      </nav>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden">

        <div className="pointer-events-none absolute left-1/2 top-24 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-20 text-center lg:pt-28">

          <p className="mb-6 text-sm font-medium uppercase tracking-[0.3em] text-violet-400">
            Machine-learning powered discovery
          </p>

          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-8xl">
            Discover your
            <br />
            <span className="text-zinc-500">
              next favorite song.
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            Find music that matches the sound of what you already
            love. Explore recommendations generated from musical
            characteristics and similarity.
          </p>

          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="mt-12 w-full max-w-2xl">

            <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.04] p-2 shadow-2xl shadow-black/20 backdrop-blur-xl">

              <div className="pl-4 text-zinc-500">
                🔍
              </div>

              <input
                type="text"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Search for a song..."
                className="min-w-0 flex-1 bg-transparent px-4 py-4 text-sm text-white outline-none placeholder:text-zinc-600"
              />

              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {searchLoading ? "Searching..." : "Search"}
              </button>

            </div>

            {error && (
              <p className="mt-4 text-sm text-red-400">
                {error}
              </p>
            )}

          </div>

        </div>
      </section>

      {/* =====================================================
          SEARCH RESULTS
      ===================================================== */}

      {results.length > 0 && !selectedSong && (

        <section className="mx-auto max-w-5xl px-6 pb-24">

          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-600">
              Search results
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Choose a song
            </h2>
          </div>

          <div className="space-y-3">

            {results.map((song) => (

              <button
                key={`${song.index}-${song.name}`}
                onClick={() => handleSongSelect(song)}
                className="group flex w-full items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 text-left transition hover:border-violet-400/30 hover:bg-white/[0.05]"
              >

                <div className="flex items-center gap-4">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-zinc-500">
                    ♪
                  </div>

                  <div>

                    <h3 className="font-medium text-white">
                      {song.name}
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      {song.artists}
                    </p>

                  </div>

                </div>

                <div className="text-right">

                  <p className="text-sm text-zinc-400">
                    {song.year}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    Popularity {song.popularity}
                  </p>

                </div>

              </button>

            ))}

          </div>

        </section>

      )}

      {/* =====================================================
          SELECTED SONG
      ===================================================== */}

      {selectedSong && (

        <section className="mx-auto max-w-5xl px-6 pb-10">

          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-7">

            <p className="text-xs uppercase tracking-[0.25em] text-violet-400">
              Selected track
            </p>

            <div className="mt-5 flex items-center justify-between gap-6">

              <div className="flex items-center gap-5">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl text-violet-300">
                  ♪
                </div>

                <div>

                  <h2 className="text-2xl font-semibold">
                    {selectedSong.name}
                  </h2>

                  <p className="mt-1 text-zinc-500">
                    {selectedSong.artists}
                  </p>

                </div>

              </div>

              <div className="hidden text-right sm:block">

                <p className="text-sm text-zinc-400">
                  {selectedSong.year}
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  Popularity {selectedSong.popularity}
                </p>

              </div>

            </div>

          </div>

        </section>

      )}

      {/* =====================================================
          RECOMMENDATION LOADING
      ===================================================== */}

      {recommendationLoading && (

        <section className="mx-auto max-w-5xl px-6 pb-24">

          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />

            <p className="mt-5 text-sm text-zinc-500">
              Finding songs with a similar sound...
            </p>

          </div>

        </section>

      )}

      {/* =====================================================
          RECOMMENDATIONS
      ===================================================== */}

      {recommendations.length > 0 && !recommendationLoading && (

        <section className="mx-auto max-w-5xl px-6 pb-24">

          <div className="mb-8">

            <p className="text-sm uppercase tracking-[0.2em] text-violet-400">
              Your recommendations
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Because you like {selectedSong?.name}
            </h2>

            <p className="mt-3 text-sm text-zinc-500">
              Ten tracks selected based on musical similarity.
            </p>

          </div>

          <div className="space-y-3">

            {recommendations.map((recommendation, index) => (

              <div
                key={`${recommendation.name}-${index}`}
                className="group flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 transition hover:border-white/[0.12] hover:bg-white/[0.05]"
              >

                <div className="flex items-center gap-5">

                  <div className="w-6 text-sm text-zinc-700">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06] text-zinc-500">
                    ♪
                  </div>

                  <div>

                    <h3 className="font-medium text-white">
                      {recommendation.name}
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      {recommendation.artists}
                    </p>

                  </div>

                </div>

                <div className="text-right">

                  <p className="text-sm text-zinc-400">
                    {recommendation.year}
                  </p>

                  <p className="mt-1 text-xs text-violet-400">
                    {(recommendation.similarity * 100).toFixed(1)}% match
                  </p>

                </div>

              </div>

            ))}

          </div>

          <button
            onClick={() => {
              setSelectedSong(null);
              setRecommendations([]);
              setResults([]);
              setQuery("");
            }}
            className="mt-8 rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            Search for another song
          </button>

        </section>

      )}

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section
        id="how-it-works"
        className="border-t border-white/[0.06]"
      >

        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">

          <div className="max-w-xl">

            <p className="text-sm uppercase tracking-[0.25em] text-violet-400">
              How it works
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              From a song you know
              <br />
              to something new.
            </h2>

          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">

            {[
              {
                number: "01",
                title: "Choose a song",
                description:
                  "Search the catalog for a track you already enjoy.",
              },
              {
                number: "02",
                title: "Analyze its sound",
                description:
                  "The recommendation engine compares its musical characteristics.",
              },
              {
                number: "03",
                title: "Discover something new",
                description:
                  "Explore tracks with similar musical profiles.",
              },
            ].map((step) => (

              <div
                key={step.number}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7"
              >

                <span className="text-sm text-violet-400">
                  {step.number}
                </span>

                <h3 className="mt-8 text-xl font-medium">
                  {step.title}
                </h3>

                <p className="mt-3 leading-6 text-zinc-500">
                  {step.description}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-white/[0.06]">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8 text-sm text-zinc-600 lg:px-8">

          <p>SONORA</p>

          <p>
            Machine learning × music discovery
          </p>

        </div>

      </footer>

    </main>
  );
}