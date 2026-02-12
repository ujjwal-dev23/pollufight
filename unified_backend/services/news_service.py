import requests
import xml.etree.ElementTree as ET
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

import random

def fetch_pollution_news():
    """Fetch environmental/pollution news for Delhi NCR via Google News RSS."""
    # List of queries to expand the variety of news
    queries = [
        "pollution Delhi NCR",
        "air quality Delhi NCR",
        "climate change Delhi",
        "environment protection Delhi",
        "renewable energy Delhi",
        "electric vehicles Delhi NCR"
    ]
    
    unique_links = set()
    all_items = []
    
    for query in queries:
        query_safe = query.replace(" ", "%20")
        url = f"https://news.google.com/rss/search?q={query_safe}&hl=en-IN&gl=IN&ceid=IN:en"
        
        try:
            response = requests.get(url, timeout=10)
            if response.status_code != 200:
                continue
            
            root = ET.fromstring(response.content)
            
            # Google News RSS structure: channel -> item
            for item in root.findall("./channel/item"):
                link = item.find("link").text
                
                # Deduplicate across different queries
                if link in unique_links:
                    continue
                unique_links.add(link)

                title = item.find("title").text
                pub_date = item.find("pubDate").text
                source = item.find("source").text if item.find("source") is not None else "News Source"
                
                # Categorization logic
                tag = "UPDATE"
                title_lower = title.lower()
                if any(word in title_lower for word in ["critical", "hazardous", "emergency", "severe", "grap", "smog"]):
                    tag = "CRITICAL"
                elif any(word in title_lower for word in ["policy", "ban", "mandate", "government", "sc", "court", "law"]):
                    tag = "POLCY"
                elif any(word in title_lower for word in ["global", "un", "world", "climate", "cop28", "treaty"]):
                    tag = "GLOBAL"
                    
                all_items.append({
                    "id": link,
                    "title": title.split(" - ")[0],
                    "source": source,
                    "time": pub_date,
                    "summary": title,
                    "tag": tag,
                    "url": link
                })
        except Exception as e:
            logger.error(f"Error fetching news for query '{query}': {e}")

    logger.info(f"Total unique news items fetched: {len(all_items)}")

    if not all_items:
        return []
        
    # Shuffle and take 5 to provide a "new set" on each refresh
    random.shuffle(all_items)
    return all_items[:5]
