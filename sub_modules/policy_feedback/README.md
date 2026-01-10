# 🏛️ Mayor's Dashboard: AI-Powered Community Insights

The **Mayor's Dashboard** is a high-fidelity, single-page analytical tool that transforms raw community feedback into actionable urban insights. Using a state-of-the-art AI pipeline, it analyzes large volumes of comments to identify sentiment, thematic pillars, and innovative suggestions.

![Premium UI Preview](https://via.placeholder.com/1200x600/0a0b10/6366f1?text=Mayor's+Dashboard+Premium+UI)

## 🚀 Key Features

-   **The Vibe Check (Sentiment Score)**: Real-time sentiment analysis visualizing Support, Neutrality, and Opposition with custom gradient charts.
-   **Deep Sentiment Analysis**: "Self-healing" AI nodes that identify deep urgency, group concerns, and emotional undercurrents.
-   **The Theme Map**: Automatic clustering of hundreds of comments into 4-5 core thematic pillars with mention counts.
-   **Innovation Spotter**: AI-driven extraction of unique, constructive urban planning ideas that often get buried in repetitive complaints.
-   **Premium Interface**: Built with advanced glassmorphism, 'Outfit' typography, and staggered motion design for a professional, operational feel.

## 🛠️ Tech Stack

### Backend
-   **Python 3.9+**
-   **FastAPI**: High-performance web framework.
-   **LangGraph**: Sophisticated AI orchestrator for multi-node analysis.
-   **Hugging Face Router**: Direct integration with `meta-llama/Llama-3.2-3B-Instruct` for reliable free-tier inference.
-   **Pydantic**: Robust data validation and self-healing JSON parsing.

### Frontend
-   **React (Vite)**: Modern, lightning-fast frontend framework.
-   **Framer Motion**: Advanced motion design and staggered entry animations.
-   **Recharts**: Custom-themed data visualizations.
-   **Lucide Icons**: High-quality SVG iconography.
-   **Vanilla CSS**: Custom design system featuring glassmorphism and radial gradients.

## 📦 Installation & Setup

### 1. Prerequisites
-   Python installed on your system.
-   Node.js (for frontend).
-   A [Hugging Face API Token](https://huggingface.co/settings/tokens).

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
```
-   Create a `.env` file in the `backend/` directory:
```env
HUGGINGFACEHUB_API_TOKEN=your_token_here
```
-   Start the server:
```bash
python3 main.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🖥️ Usage
1.  Open the frontend (usually `http://localhost:5173`).
2.  Paste community comments (one per line) into the input area.
3.  Click **"Generate AI Report"**.
4.  Watch the staggered animations load the Vibe Check, Theme Map, and Innovation Spotter!

---

*Built for urban planners, by AI.*
