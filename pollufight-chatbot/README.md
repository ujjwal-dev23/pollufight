# PolluFight Chatbot Service

The **PolluFight Chatbot** is a standalone AI service designed to act as the intelligence layer for the PolluFight platform. It leverages a local Large Language Model (LLM) to provide citizens with instant, accurate information about pollution and the application's features.

## Purpose & Awareness Role

### 1. Civic Education
The chatbot's primary goal is to **educate**. It explains:
- **Pollution Types**: Causes and effects of smoke, vehicle emissions, and industrial waste.
- **prevention**: Actionable steps citizens can take to mitigate pollution.

### 2. Platform Navigation
It guides users on how to use PolluFight effectively:
- **AI Lens**: How to use the camera to detect pollution.
- **Guilty Map**: Understanding the heatmaps and severity colors.
- **Reporting**: The step-by-step process of submitting a violation.

### 3. Complementing PolluFight
While the main app focuses on *reporting* and *visualization*, this chatbot focuses on *understanding*. It bridges the gap between seeing a problem and knowing what to do about it, driving more high-quality reports and citizen engagement.

## Technical Setup

### Prerequisites
- Python 3.9+
- 4GB+ RAM (for local model inference)

### Installation

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configuration**
   The app uses `TinyLlama` by default. You can change settings in `app/config.py` or via `.env`.

3. **Run Locally**
   ```bash
   python -m app.main
   ```
   Server will start on `http://localhost:5001`.

## Integration

### Frontend
The frontend should make POST requests to this service:

**Endpoint**: `POST /api/chat`

**Request Body**:
```json
{
  "query": "What is the Guilty Map?"
}
```

**Response**:
```json
{
  "response": "The Guilty Map is a real-time visualization tool..."
}
```

### Health Check
Monitor service status via `GET /health`.
