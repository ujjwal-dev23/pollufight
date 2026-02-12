# Backend Analysis & Consolidation Summary

## Current Backend Count: **2 Separate Backends**

### Backend #1: Pollution Detector
- **Port**: 8000
- **Location**: `sub_modules/pollution_detector/main.py`
- **Purpose**: Image-based pollution detection
- **Technology**: FastAPI (Python)
- **Key Features**:
  - Object detection using DETR model
  - Scene classification using ViT model
  - Legal draft generation
- **Endpoints**: 
  - `POST /analyze` (image analysis)
  - `GET /` (static files)
  - `GET /health`

### Backend #2: Policy Feedback
- **Port**: 8001
- **Location**: `sub_modules/policy_feedback/backend/main.py`
- **Purpose**: Community comment analysis
- **Technology**: FastAPI (Python) + LangGraph
- **Key Features**:
  - Sentiment analysis
  - Theme clustering
  - Innovation spotting
- **Endpoints**:
  - `POST /analyze` (comment analysis)
  - `GET /health`

## External Services (Not Backends)

1. **Firebase Firestore** - Database service
2. **Cloudinary** - Image storage/CDN
3. **Hugging Face API** - AI/ML inference (used by both backends)

## Problems with Current Architecture

1. ❌ **Two separate processes** consuming resources
2. ❌ **Code duplication** (CORS, error handling, config)
3. ❌ **Deployment complexity** (need to start 2 servers)
4. ❌ **Inconsistent API** structure
5. ❌ **Separate configuration** management
6. ❌ **Resource overhead** (2x memory footprint)

## Recommended Solution: Unified Backend

### Structure
```
unified_backend/
├── main.py                    # Single FastAPI app
├── routes/
│   ├── pollution.py           # /api/pollution/*
│   ├── policy.py              # /api/policy/*
│   └── health.py              # /health
├── services/
│   ├── ai_service.py          # Shared Hugging Face client
│   ├── pollution_service.py
│   └── policy_service.py
└── config.py                  # Unified configuration
```

### Benefits
- ✅ **Single process** (port 8000 only)
- ✅ **30-40% less memory** usage
- ✅ **Unified configuration** and error handling
- ✅ **Easier deployment** (one command)
- ✅ **Code reuse** (shared services)
- ✅ **Consistent API** structure
- ✅ **Simpler testing** and maintenance

### Migration Path

1. **Create unified backend structure**
2. **Move routes** with prefixes (`/api/pollution/*`, `/api/policy/*`)
3. **Create shared AI service** for Hugging Face calls
4. **Update frontend** API URLs
5. **Update start script** to run single backend
6. **Test thoroughly** before removing old backends

### Frontend Changes Required

```typescript
// Before
const POLLUTION_API = `${getApiBaseUrl(8000)}/analyze`;
const POLICY_API = `${getApiBaseUrl(8001)}/analyze`;

// After
const POLLUTION_API = `${getApiBaseUrl(8000)}/api/pollution/analyze`;
const POLICY_API = `${getApiBaseUrl(8000)}/api/policy/analyze`;
```

## Implementation Effort

- **Time Estimate**: 2-4 hours
- **Complexity**: Low-Medium
- **Risk**: Low (can keep old backends during migration)
- **Testing**: Update existing tests to use new endpoints

## Conclusion

**Current State**: 2 backends running on ports 8000 and 8001

**Recommended**: Consolidate into 1 unified backend on port 8000

**Impact**: Significant reduction in complexity and resource usage with minimal code changes required.
