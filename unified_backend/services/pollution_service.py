"""Pollution detection service."""
import io
import logging
from typing import Dict, Any, List, Optional
from PIL import Image
from .ai_service import ai_service

logger = logging.getLogger(__name__)

# Pollution type mappings
POLLUTION_MAP = {
    "vehicle": "Vehicular Emission",
    "car": "Vehicular Emission",
    "truck": "Vehicular Emission",
    "bus": "Vehicular Emission",
    "motorcycle": "Vehicular Emission",
    "train": "Vehicular Emission",
    "airplane": "Vehicular Emission",
    "boat": "Vehicular Emission",
    "smoke": "Air Pollution (Smoke)",
    "fire": "Air Pollution (Fire)",
    "factory": "Industrial Emission",
    "chimney": "Industrial Emission",
    "trash": "Solid Waste/Garbage",
    "waste": "Solid Waste/Garbage",
    "garbage": "Solid Waste/Garbage",
    "rubbish": "Solid Waste/Garbage",
    "plastic": "Solid Waste/Garbage",
    "bag": "Solid Waste/Garbage",
    "bottle": "Solid Waste/Garbage",
}

SCENE_MAP = {
    "waste_container": "Solid Waste/Garbage",
    "garbage_truck": "Solid Waste/Garbage",
    "ashcan": "Solid Waste/Garbage",
    "trash_can": "Solid Waste/Garbage",
    "dumpster": "Solid Waste/Garbage",
    "landfill": "Solid Waste/Garbage",
    "junkyard": "Solid Waste/Garbage",
    "refuse": "Solid Waste/Garbage",
    "factory": "Industrial Emission",
    "chimney": "Industrial Emission",
    "steel_mill": "Industrial Emission",
    "paper_mill": "Industrial Emission",
}


def map_label_to_pollution(label: str) -> str:
    """Maps a detected object label to a pollution type."""
    if not label:
        return "Unknown/General Pollution"
    label_lower = label.lower()
    for key, value in POLLUTION_MAP.items():
        if key in label_lower:
            return value
    return "Unknown/General Pollution"


async def detect_pollution(image: Optional[Image.Image] = None, filename: str = "") -> Dict[str, Any]:
    """
    Detects pollution in an image using AI models.
    Includes offline demo mode based on filename.
    """
    # Offline demo mode based on filename
    fname = filename.lower() if filename else ""
    demo_map = {
        "waste": "Solid Waste/Garbage",
        "trash": "Solid Waste/Garbage",
        "garbage": "Solid Waste/Garbage",
        "rubbish": "Solid Waste/Garbage",
        "dump": "Solid Waste/Garbage",
        "plastic": "Solid Waste/Garbage",
        "bottle": "Solid Waste/Garbage",
        "car": "Vehicular Emission",
        "vehicle": "Vehicular Emission",
        "traffic": "Vehicular Emission",
        "truck": "Vehicular Emission",
        "bus": "Vehicular Emission",
        "smoke": "Air Pollution (Smoke)",
        "fire": "Air Pollution (Fire)",
        "factory": "Industrial Emission",
        "industry": "Industrial Emission",
        "chimney": "Industrial Emission"
    }

    # Check for demo mode
    for key, val in demo_map.items():
        if key in fname:
            logger.info(f"OFFLINE DEMO: Detected '{key}' in filename. Returning {val}.")
            return {
                "pollution_type": val,
                "confidence_level": 0.98,
                "details": [
                    {
                        "label": key,
                        "score": 0.99,
                        "pollution_type": val,
                        "box": [100, 100, 500, 500],
                        "source": "Offline Simulator"
                    }
                ]
            }

    if image is None:
        logger.info("No image provided. Returning 'Image Required' error.")
        return {
            "pollution_type": "Image Required",
            "confidence_level": 0.0,
            "details": [{"label": "Error", "score": 0.0, "source": "System: No image provided", "pollution_type": "Error"}]
        }

    try:
        logger.info("Starting hybrid detection...")
        
        # Convert image to bytes
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format="JPEG")
        img_bytes = img_byte_arr.getvalue()

        # Run object detection and scene classification in parallel
        det_results = await ai_service.detect_objects(img_bytes)
        cls_results = await ai_service.classify_scene(img_bytes)

        # Process results
        pollution_scores = {}
        detected_items = []

        # Process DETR results
        if isinstance(det_results, list):
            for item in det_results:
                if not isinstance(item, dict):
                    continue
                label = item.get('label', '')
                score = item.get('score', 0.0)
                box = item.get('box')
                
                # Convert box from dict to list format if needed
                if box and isinstance(box, dict):
                    box = [box.get('xmin', 0), box.get('ymin', 0), box.get('xmax', 0), box.get('ymax', 0)]
                
                pollution_type = map_label_to_pollution(label)
                detected_items.append({
                    "label": label,
                    "score": score,
                    "pollution_type": pollution_type,
                    "box": box,
                    "source": "Object Detector"
                })
                
                if pollution_type != "Unknown/General Pollution":
                    if pollution_type not in pollution_scores:
                        pollution_scores[pollution_type] = 0.0
                    pollution_scores[pollution_type] = max(pollution_scores[pollution_type], score)

        # Process ViT results
        if isinstance(cls_results, list):
            for item in cls_results:
                if not isinstance(item, dict):
                    continue
                label = item.get('label', '')
                score = item.get('score', 0.0)
                
                p_type = "Unknown"
                label_lower = label.lower()
                for key, val in SCENE_MAP.items():
                    if key in label_lower:
                        p_type = val
                        break
                
                if p_type == "Unknown":
                    if "waste" in label_lower or "trash" in label_lower or "garbage" in label_lower:
                        p_type = "Solid Waste/Garbage"
                    elif "smoke" in label_lower:
                        p_type = "Air Pollution (Smoke)"
                
                if p_type != "Unknown":
                    detected_items.append({
                        "label": label,
                        "score": score,
                        "pollution_type": p_type,
                        "source": "Scene Classifier"
                    })
                    if p_type not in pollution_scores:
                        pollution_scores[p_type] = 0.0
                    pollution_scores[p_type] = max(pollution_scores[p_type], score * 1.1)

        # Determine final pollution type
        if not pollution_scores:
            best_pollution = "No obvious pollution detected"
            confidence = 0.0
        else:
            # Priority: Waste/Fire > Vehicle
            if "Solid Waste/Garbage" in pollution_scores and pollution_scores["Solid Waste/Garbage"] > 0.3:
                best_pollution = "Solid Waste/Garbage"
                confidence = pollution_scores["Solid Waste/Garbage"]
            elif "Air Pollution (Fire)" in pollution_scores and pollution_scores["Air Pollution (Fire)"] > 0.4:
                best_pollution = "Air Pollution (Fire)"
                confidence = pollution_scores["Air Pollution (Fire)"]
            else:
                best_pollution = max(pollution_scores, key=pollution_scores.get)
                confidence = pollution_scores[best_pollution]

        if confidence > 1.0:
            confidence = 0.9999

        logger.info(f"Final Decision: {best_pollution} ({confidence})")

        return {
            "pollution_type": best_pollution,
            "confidence_level": round(confidence, 4),
            "details": detected_items
        }

    except Exception as e:
        import traceback
        logger.error(f"CRITICAL ERROR: {traceback.format_exc()}")
        return {
            "pollution_type": "Error During Detection",
            "confidence_level": 0.0,
            "details": [{"label": "Error", "score": 0.0, "source": str(e), "pollution_type": "Error"}]
        }
