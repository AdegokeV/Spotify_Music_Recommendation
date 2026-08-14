import os
import joblib
import numpy as np
import pandas as pd


# ============================================================
# PATH CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")


# ============================================================
# LOAD SAVED MODEL ARTIFACTS
# ============================================================

print("Loading recommendation model...")

recommender = joblib.load(
    os.path.join(MODEL_DIR, "recommender.joblib")
)

scaler = joblib.load(
    os.path.join(MODEL_DIR, "scaler.joblib")
)

song_catalog = pd.read_parquet(
    os.path.join(MODEL_DIR, "song_catalog.parquet")
)

scaled_features = np.load(
    os.path.join(MODEL_DIR, "scaled_features.npy")
)


# ============================================================
# VALIDATE MODEL ARTIFACTS
# ============================================================

if len(song_catalog) != len(scaled_features):
    raise ValueError(
        "ERROR: song_catalog and scaled_features "
        "contain different numbers of songs."
    )


print(
    f"Loaded {len(song_catalog):,} songs."
)

print(
    "Recommendation model loaded successfully."
)


# ============================================================
# SEARCH SONGS
# ============================================================

def search_songs(query, limit=10):
    """
    Search the local song catalog by song name.

    Parameters
    ----------
    query : str
        Song name or part of a song name.

    limit : int
        Maximum number of results to return.

    Returns
    -------
    list
        List of matching songs.
    """

    if not isinstance(query, str):
        return []

    query = query.strip().lower()

    if not query:
        return []

    # Search song names
    matches = song_catalog[
        song_catalog["name"]
        .astype(str)
        .str.lower()
        .str.contains(
            query,
            na=False,
            regex=False
        )
    ]

    # Limit results
    matches = matches.head(limit)

    results = []

    for index, row in matches.iterrows():

        results.append({
            "index": int(index),

            "name": row["name"],

            "artists": row["artists"],

            "year": (
                int(row["year"])
                if pd.notna(row["year"])
                else None
            ),

            "popularity": (
                int(row["popularity"])
                if pd.notna(row["popularity"])
                else None
            )
        })

    return results


# ============================================================
# RECOMMEND SONGS
# ============================================================

def recommend_song(song_index, limit=10):
    """
    Generate song recommendations using
    the trained NearestNeighbors model.

    Parameters
    ----------
    song_index : int
        Index of the selected song.

    limit : int
        Number of recommendations requested.

    Returns
    -------
    list
        Recommended songs with similarity scores.
    """

    # --------------------------------------------------------
    # Validate index
    # --------------------------------------------------------

    if song_index < 0 or song_index >= len(song_catalog):

        raise IndexError(
            f"Song index {song_index} is outside "
            f"the available range."
        )

    # --------------------------------------------------------
    # Get selected song
    # --------------------------------------------------------

    selected_song = song_catalog.iloc[song_index]

    selected_song_name = str(
        selected_song["name"]
    ).strip().lower()

    # --------------------------------------------------------
    # Get feature vector for selected song
    # --------------------------------------------------------

    query_vector = scaled_features[
        song_index
    ].reshape(1, -1)

    # --------------------------------------------------------
    # Retrieve additional neighbors.
    #
    # We request more than the requested limit because
    # duplicate songs may be removed later.
    # --------------------------------------------------------

    number_of_neighbors = min(
        limit + 20,
        len(song_catalog)
    )

    distances, indices = recommender.kneighbors(
        query_vector,
        n_neighbors=number_of_neighbors
    )

    recommendations = []

    # Keep track of songs we've already added
    seen_songs = set()

    # --------------------------------------------------------
    # Process nearest neighbors
    # --------------------------------------------------------

    for distance, index in zip(
        distances[0],
        indices[0]
    ):

        # Convert numpy integer to normal Python integer
        index = int(index)

        # ----------------------------------------------------
        # Don't recommend the selected row itself
        # ----------------------------------------------------

        if index == song_index:
            continue

        row = song_catalog.iloc[index]

        # ----------------------------------------------------
        # Don't recommend duplicate copies of the
        # selected song
        # ----------------------------------------------------

        recommended_song_name = str(
            row["name"]
        ).strip().lower()

        if recommended_song_name == selected_song_name:
            continue

        # ----------------------------------------------------
        # Prevent duplicate recommendations
        # ----------------------------------------------------

        song_key = (
            recommended_song_name,
            str(row["artists"]).strip().lower()
        )

        if song_key in seen_songs:
            continue

        seen_songs.add(song_key)

        # ----------------------------------------------------
        # Convert cosine distance to similarity
        #
        # cosine similarity = 1 - cosine distance
        # ----------------------------------------------------

        similarity = 1 - float(distance)

        # Make sure floating-point errors don't produce
        # values outside the expected range.
        similarity = max(
            0.0,
            min(1.0, similarity)
        )

        # ----------------------------------------------------
        # Add recommendation
        # ----------------------------------------------------

        recommendations.append({

            "name": row["name"],

            "artists": row["artists"],

            "year": (
                int(row["year"])
                if pd.notna(row["year"])
                else None
            ),

            "popularity": (
                int(row["popularity"])
                if pd.notna(row["popularity"])
                else None
            ),

            "similarity": round(
                similarity,
                6
            )
        })

        # ----------------------------------------------------
        # Stop once we have enough recommendations
        # ----------------------------------------------------

        if len(recommendations) >= limit:
            break

    return recommendations


# ============================================================
# GET RECOMMENDATIONS BY SONG NAME
# ============================================================

def get_recommendations_by_song(
    song_name,
    limit=10
):
    """
    Search for a song by name and generate
    recommendations for the first matching song.

    This function will eventually be useful
    for the FastAPI backend.
    """

    results = search_songs(
        song_name,
        limit=10
    )

    if not results:
        return {
            "success": False,
            "message": (
                f"Song '{song_name}' "
                "was not found in the dataset."
            ),
            "song": None,
            "recommendations": []
        }

    selected_song = results[0]

    recommendations = recommend_song(
        selected_song["index"],
        limit=limit
    )

    return {
        "success": True,

        "message": "Recommendations generated successfully.",

        "song": {
            "name": selected_song["name"],
            "artists": selected_song["artists"],
            "year": selected_song["year"],
            "popularity": selected_song["popularity"]
        },

        "recommendations": recommendations
    }


# ============================================================
# LOCAL TEST
# ============================================================

if __name__ == "__main__":

    print("\n" + "=" * 60)
    print("SPOTIFY RECOMMENDER LOCAL TEST")
    print("=" * 60)

    # --------------------------------------------------------
    # Test 1: Search
    # --------------------------------------------------------

    print("\n1. Searching for 'Shape of You'...")

    search_results = search_songs(
        "Shape of You"
    )

    print("\nSearch results:")

    for result in search_results:

        print(
            f"Index: {result['index']} | "
            f"Song: {result['name']} | "
            f"Artist: {result['artists']} | "
            f"Year: {result['year']} | "
            f"Popularity: {result['popularity']}"
        )

    # --------------------------------------------------------
    # Test 2: Generate recommendations
    # --------------------------------------------------------

    if search_results:

        selected_index = search_results[0]["index"]

        print(
            f"\n2. Generating recommendations "
            f"for '{search_results[0]['name']}'..."
        )

        recommendations = recommend_song(
            selected_index,
            limit=10
        )

        print("\nRecommendations:")

        for i, recommendation in enumerate(
            recommendations,
            start=1
        ):

            print(
                f"{i}. "
                f"{recommendation['name']} — "
                f"{recommendation['artists']} "
                f"| Year: "
                f"{recommendation['year']} "
                f"| Popularity: "
                f"{recommendation['popularity']} "
                f"| Similarity: "
                f"{recommendation['similarity']}"
            )

    else:

        print(
            "\nShape of You was not found "
            "in the local dataset."
        )

    # --------------------------------------------------------
    # Test 3: Full recommendation function
    # --------------------------------------------------------

    print(
        "\n3. Testing get_recommendations_by_song()..."
    )

    result = get_recommendations_by_song(
        "Shape of You",
        limit=5
    )

    print("\nResult:")

    print(result)

    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)