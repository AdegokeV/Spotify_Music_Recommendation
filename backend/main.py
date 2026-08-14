from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from backend.recommender import (
    search_songs,
    get_recommendations_by_song
)


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="Spotify Recommendation API",
    description=(
        "A machine-learning powered music recommendation API "
        "using KNN and cosine similarity."
    ),
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://sonora-music-recommendation.vercel.app",
        "https://sonora-music-rec-git-cf863c-dmboluwatosinadegoke-3994s-projects.vercel.app",
        "https://sonora-music-recommendation-chnca83k3.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "name": "Spotify Recommendation API",
        "version": "1.0.0",
        "status": "running"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy"
    }


# ============================================================
# SEARCH
# ============================================================

@app.get("/search")
def search(
    query: str = Query(
        ...,
        min_length=1,
        description="Song name to search for"
    )
):

    results = search_songs(
        query=query,
        limit=10
    )

    return {
        "query": query,
        "results": results
    }


# ============================================================
# RECOMMENDATIONS
# ============================================================

@app.get("/recommend")
def recommend(
    song: str = Query(
        ...,
        min_length=1,
        description="Song name"
    ),
    limit: int = Query(
        10,
        ge=1,
        le=50,
        description="Number of recommendations"
    )
):

    result = get_recommendations_by_song(
        song_name=song,
        limit=limit
    )

    if not result["success"]:

        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return result