
import requests
import json
import sys

def test_analyze():
    url = "http://localhost:8000/api/policy/analyze"
    comments = [
        "I love the new park plan!",
        "Traffic is terrible on Main St.",
        "We need more bike lanes.",
        "The noise from the construction is unbearable.",
        "Public transport is unreliable."
    ]
    payload = {"comments": comments}
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        try:
            print("Response JSON:", response.json())
        except:
            print("Response Text:", response.text)
            
        if response.status_code == 200:
            print("Success!")
        else:
            print("Failed!")
            sys.exit(1)
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_analyze()
