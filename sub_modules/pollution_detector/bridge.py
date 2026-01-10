import argparse
import json
import sys
import os
import requests
from PIL import Image
from io import BytesIO

# Add current directory to sys.path to allow imports from local modules
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

try:
    from detector import detect_pollution
    from drafter import generate_legal_draft
except ImportError as e:
    print(json.dumps({"error": f"ImportError: {str(e)}", "path": sys.path}))
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description='Pollution Detector Bridge')
    parser.add_argument('image_url', type=str, help='URL of the image to analyze')
    args = parser.parse_args()

    try:
        # Download image
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(args.image_url, headers=headers)
        response.raise_for_status()
        image = Image.open(BytesIO(response.content))

        # Detect pollution
        filename = "downloaded_image.jpg"
        detection_result = detect_pollution(image, filename)

        pollution_type = detection_result.get("pollution_type", "Unknown")
        confidence = detection_result.get("confidence_level", 0.0)
        details = detection_result.get("details", [])

        # Generate draft
        if pollution_type == "No obvious pollution detected":
             legal_draft = "No significant pollution detected warranting a legal notice."
        else:
             legal_draft = generate_legal_draft(pollution_type, details)

        result = {
            "pollution_type": pollution_type,
            "confidence_level": confidence,
            "legal_draft": legal_draft,
            "details": details
        }
        
        print(json.dumps(result))

    except Exception as e:
        error_result = {
            "error": str(e),
            "pollution_type": "Error",
            "confidence_level": 0.0,
            "details": []
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()
