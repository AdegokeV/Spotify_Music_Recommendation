# Sonora

A full-stack music recommendation platform that finds songs with similar musical characteristics.

**Live Demo:** https://sonora-music-recommendation.vercel.app/

## Overview

Sonora lets a user search for a song, select a result, and receive a list of songs that are similar to it based on musical features.

The project combines a data-processing and recommendation workflow with a web application. The recommendation model is prepared offline and its saved artifacts are loaded by a FastAPI backend. A Next.js frontend communicates with the backend through a REST API.

The current system is **content-based**: recommendations are based on the characteristics of the selected song rather than an individual user's listening history.

## How It Works

```text
User
  ↓
Next.js Frontend
  ↓
FastAPI REST API
  ↓
Recommendation Service
  ↓
KNN / Similarity Model
  ↓
Song Feature Dataset
  ↓
Recommended Songs
```

### 1. Search

The user searches for a song from the Sonora interface.

The frontend sends the search query to the FastAPI backend, which searches the song catalogue and returns matching results.

### 2. Song Selection

The user selects a song from the search results.

That song is passed to the recommendation endpoint.

### 3. Feature Representation

Songs are represented using numerical music-related features. The features used by the recommendation workflow are prepared during the data-processing stage and scaled before being used by the model.

### 4. Similarity Calculation

The recommendation system compares the selected song's feature representation with other songs.

Cosine similarity is used to measure how similar the feature vectors are, while the saved K-Nearest Neighbors model is used to retrieve nearby songs.

### 5. Recommendations

The closest matching songs are returned to the frontend and displayed to the user.

The recommendation logic also avoids returning the selected song and handles duplicate copies of the same song where applicable.

---

## Recommendation Method

Sonora uses a **content-based recommendation approach**.

Each song is represented as a numerical feature vector. Rather than learning from individual user behaviour, the system looks at the musical characteristics of the selected track and finds other tracks with similar feature profiles.

### Feature processing

The data-processing workflow includes steps such as:

* Parsing release-date information
* Standardising artist information
* Checking missing values
* Checking duplicate Spotify IDs
* Handling duplicate song/artist combinations
* Preparing numerical features
* Scaling the feature values used by the recommendation model

The processed feature matrix is saved so that the deployed API does not need to repeat the data-preparation process for every request.

### Cosine similarity

Cosine similarity compares the direction of two feature vectors rather than simply comparing their raw values.

In practical terms, songs with more similar feature profiles receive higher similarity scores.

### K-Nearest Neighbors

The trained `NearestNeighbors` model is saved as a Joblib artifact and loaded by the backend.

When a song is selected, the recommendation service uses the model to identify nearby songs in the prepared feature space.

The result is then filtered and ranked before being returned to the frontend.

---

## Dataset

The recommendation system was developed using a large music dataset containing song-level and artist-level information.

The cleaned recommendation catalogue contains **170,653 songs** loaded by the deployed recommendation service.

Relevant music attributes include information such as:

* Song name
* Artist
* Spotify ID
* Danceability
* Energy
* Acousticness
* Instrumentalness
* Liveness
* Loudness
* Speechiness
* Tempo
* Valence
* Popularity
* Release information

The original data required cleaning and preparation before it could be used by the recommendation model. In particular, release-date formats and artist information required standardisation, while duplicate records were checked before the final recommendation data was prepared.

---

## Machine Learning Architecture

The model is trained and prepared separately from the API.

```text
Raw Dataset
    ↓
Data Cleaning
    ↓
Feature Selection
    ↓
Feature Scaling
    ↓
Feature Matrix
    ↓
KNN Model
    ↓
Saved Model Artifacts
    ↓
FastAPI Backend
```

The repository stores the prepared recommendation artifacts in `backend/model/`:

| File                   | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| `recommender.joblib`   | Saved K-Nearest Neighbors recommendation model   |
| `scaled_features.npy`  | Scaled song feature matrix                       |
| `scaler.joblib`        | Saved feature scaler                             |
| `song_catalog.parquet` | Song metadata used by the recommendation service |

This means the API loads the existing model and processed data instead of retraining the recommendation system whenever a request is received.

---

## API

The backend is implemented with FastAPI.

### `GET /`

Returns basic information about the API.

```json
{
  "name": "Spotify Recommendation API",
  "version": "1.0.0",
  "status": "running"
}
```

### `GET /health`

Checks whether the API is healthy.

```json
{
  "status": "healthy"
}
```

### `GET /search`

Searches the song catalogue.

**Query parameter:**

```text
query
```

Example:

```text
/search?query=blinding+lights
```

The endpoint returns matching songs from the catalogue.

### `GET /recommend`

Returns recommendations for a selected song.

**Query parameters:**

```text
song
limit
```

Example:

```text
/recommend?song=blinding+lights&limit=10
```

The `limit` parameter accepts between 1 and 50 recommendations, with 10 used by default.

If the requested song cannot be found, the API returns an appropriate `404` response.

---

## Tech Stack

| Layer               | Technology                 |
| ------------------- | -------------------------- |
| Frontend            | Next.js, React, TypeScript |
| Backend             | Python, FastAPI            |
| Machine Learning    | Scikit-learn               |
| Data Processing     | Pandas, NumPy              |
| Data Storage        | Parquet                    |
| Model Serialization | Joblib                     |
| API                 | REST                       |
| Frontend Deployment | Vercel                     |
| Backend Deployment  | Render                     |

---

## Project Structure

```text
sonora/
├── backend/
│   ├── __init__.py
│   ├── main.py
│   ├── recommender.py
│   ├── requirements.txt
│   └── model/
│       ├── recommender.joblib
│       ├── scaled_features.npy
│       ├── scaler.joblib
│       └── song_catalog.parquet
│
├── frontend/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   └── api.ts
│   ├── public/
│   ├── .gitignore
│   ├── next.config.ts
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.mjs
│   └── tsconfig.json
│
├── notebook/
│   └── spotify_recommendation_system.ipynb
│
└── .gitignore
```

---

## Running Locally

### Prerequisites

* Python 3.11
* Node.js
* npm

### Backend

From the project root:

```bash
python -m venv .venv
```

Activate the virtual environment on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```bash
pip install -r backend/requirements.txt
```

Start the FastAPI server:

```bash
uvicorn backend.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

You can check the health endpoint at:

```text
http://127.0.0.1:8000/health
```

### Frontend

Open another terminal and move into the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:3000
```

---

## Environment Variables

The frontend uses one environment variable to determine which backend API it should communicate with.

### Local development

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Production

The deployed frontend uses the Render backend URL:

```env
NEXT_PUBLIC_API_URL=https://sonora-api-oiwa.onrender.com
```

The production environment variable should be configured in the Vercel project rather than committed to the repository.

---

## Deployment

Sonora is deployed as two services:

```text
                         ┌──────────────────────┐
                         │      Vercel          │
                         │   Next.js Frontend   │
                         └──────────┬───────────┘
                                    │
                                    │ REST API
                                    ↓
                         ┌──────────────────────┐
                         │       Render         │
                         │    FastAPI Backend   │
                         └──────────┬───────────┘
                                    │
                                    ↓
                         ┌──────────────────────┐
                         │ Recommendation       │
                         │ Model + Song Data    │
                         └──────────────────────┘
```

**Frontend:** Vercel

**Backend:** Render

**Live application:**
https://sonora-music-recommendation.vercel.app/

**Backend API:**
https://sonora-api-oiwa.onrender.com/

The backend includes CORS configuration for the deployed frontend so that browser requests from the Vercel application can reach the Render API.

---

## Testing

The project currently relies primarily on manual integration testing rather than a large automated test suite.

The main flow tested during development is:

```text
Search for song
      ↓
Receive search results
      ↓
Select song
      ↓
Request recommendations
      ↓
Receive recommended songs
```

The backend can also be tested independently through its API endpoints.

For example:

```text
GET /health
GET /search?query=...
GET /recommend?song=...&limit=10
```

The recommendation model can also be verified locally by importing the backend and confirming that the saved model artifacts load successfully.

---

## Limitations

The current recommendation system has a few important limitations:

* Recommendations are content-based rather than personalised to an individual listener.
* The system does not currently learn from listening history or user feedback.
* Similarity is based on the available musical features and does not necessarily represent subjective taste.
* The quality of recommendations depends on the completeness and quality of the underlying dataset.
* There is currently no collaborative-filtering component.

These are limitations of the current implementation rather than assumptions about future versions.

---

## Future Improvements

Possible extensions include:

* User accounts and listening history
* Personalised recommendations based on user behaviour
* Collaborative filtering
* Hybrid recommendation models
* Recommendation evaluation metrics
* User feedback on recommendations
* Playlist generation
* Additional music metadata
* Spotify API integration

These would move the system from recommending songs similar to a selected track toward recommendations based on individual listening behaviour.

---

## Author / Project Context

Sonora was built as a data science and full-stack engineering project to explore how a recommendation model can be taken from a dataset and integrated into a usable web application.
