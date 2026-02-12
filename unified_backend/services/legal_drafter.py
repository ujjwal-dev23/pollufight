"""Legal draft generation service."""
import datetime
import logging

logger = logging.getLogger(__name__)


def generate_legal_draft(pollution_type: str, details: list, location_data: dict = None, user_name: str = "Concerned Citizen") -> str:
    """
    Generates a deterministic legal draft based on the detected pollution type.
    """
    date_str = datetime.date.today().strftime("%B %d, %Y")
    ref_no = f"ENV/COMP/{datetime.date.today().strftime('%Y%m%d')}/001"
    
    # Extract location details
    city = location_data.get('city', '[City Name]') if location_data else '[City Name]'
    state = location_data.get('state', '[State]') if location_data else '[State]'
    zip_code = location_data.get('zipcode', '[Zip Code]') if location_data else '[Zip Code]'
    full_address = location_data.get('address', '[Location/Address]') if location_data else '[Location/Address]'
    
    # Calculate overall confidence (max of individual items)
    confidence_level = 0.0
    if details:
        confidence_level = max(d.get('score', 0.0) for d in details if isinstance(d, dict))
    
    # Format details for professional listing
    evidence_list = "\n".join([
        f"   - {d.get('label', 'Unknown').title()} (Confidence: {d.get('score', 0.0):.1%})" 
        for d in details if isinstance(d, dict)
    ])
    
    # Determine specific legal context based on pollution type
    legal_context = ""
    if "Vehicle" in pollution_type:
        legal_context = "This is in direct violation of the Motor Vehicles Act and applicable Air Prevention and Control of Pollution norms regarding vehicular emissions."
    elif "Industrial" in pollution_type:
        legal_context = "This constitutes a violation of the Air (Prevention and Control of Pollution) Act and relevant environmental clearance conditions."
    elif "Waste" in pollution_type or "Garbage" in pollution_type:
        legal_context = "This is a violation of the Solid Waste Management Rules, 2016, and local municipal sanitation bylaws."
    else:
        legal_context = "This activity violates the Environment (Protection) Act and public nuisance laws under the Indian Penal Code."

    template = f"""[Legal Notice - Automated Draft]
Ref No: {ref_no}
Date: {date_str}

To,
The Regional Officer / Municipal Commissioner,
Pollution Control Board / Municipal Corporation,
{city}, {state}, {zip_code}

SUBJECT: FORMAL COMPLAINT REGARDING {pollution_type.upper()}

1. INCIDENT DETAILS
   - Pollution Type: {pollution_type}
   - Detection Confidence Level: {confidence_level:.2%}
   - Date of Observation: {date_str}
   - Location: {full_address}

2. EVIDENCE SUMMARY
The following sources were detected by our automated AI monitoring system:
{evidence_list}

3. LEGAL VIOLATIONS
{legal_context}

4. DEMAND FOR ACTION
I hereby request the competent authority to:
   a) Conduct an immediate site inspection.
   b) Take necessary measures to abate the pollution source.
   c) Initiate appropriate legal action against the violators.

Please treat this as an urgent matter affecting public health.

Sincerely,

{user_name}

"""
    return template
