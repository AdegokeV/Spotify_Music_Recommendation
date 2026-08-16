const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export interface Song {
  index: number;
  name: string;
  artists: string;
  year: number;
  popularity: number;
}

export interface Recommendation {
  name: string;
  artists: string;
  year: number;
  popularity: number;
  similarity: number;
}

export interface SearchResponse {
  query: string;
  results: Song[];
}

export interface RecommendationResponse {
  success: boolean;
  message: string;
  song: Song;
  recommendations: Recommendation[];
}

// ============================================================
// SEARCH
// ============================================================

export async function searchSongs(
  query: string
): Promise<SearchResponse> {
  const response = await fetch(
    `${API_URL}/search?query=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error("Failed to search for songs.");
  }

  return response.json();
}

// ============================================================
// RECOMMENDATIONS
// ============================================================

export async function getRecommendations(
  song: string,
  limit: number = 10
): Promise<RecommendationResponse> {
  const response = await fetch(
    `${API_URL}/recommend?song=${encodeURIComponent(song)}&limit=${limit}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.detail || "Failed to generate recommendations."
    );
  }

  return response.json();
}