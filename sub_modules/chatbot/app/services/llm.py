import torch
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer
from app.config import Config

SYSTEM_PROMPT = """You are the PolluFight AI Assistant. You help citizens understand pollution, smoke sources, prevention measures, and how the PolluFight app works.

TONE: Informative, Neutral, Civic-focused, Non-marketing.

KEY TOPICS:
- Pollution Types: Smoke, Air, Vehicle, Industrial.
- Prevention: Mitigation steps.
- App Features: AI Lens, Guilty Map, Ward Dashboard, Reporting.
"""

class LLMService:
    def __init__(self):
        self.generator = None
        self.tokenizer = None
        
    def load_model(self):
        """Loads the model at startup using configuration."""
        print(f"Loading Hugging Face model: {Config.MODEL_ID}...")
        
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(Config.MODEL_ID)
            self.model = AutoModelForCausalLM.from_pretrained(
                Config.MODEL_ID, 
                torch_dtype=torch.float32, 
                device_map=Config.DEVICE_MAP
            )
            
            self.generator = pipeline(
                "text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                max_new_tokens=256,
                temperature=0.7,
                top_p=0.95,
                repetition_penalty=1.15
            )
            print("Model loaded successfully.")
        except Exception as e:
            print(f"Error loading model: {e}")
            raise e

    def generate_response(self, query: str) -> str:
        """Generates a response for the given query using the loaded model."""
        if not self.generator:
            return "Error: AI Model is not loaded."

        # Format prompt with system instruction
        # TinyLlama format: <|system|>\n{system}<|end|>\n<|user|>\n{user}<|end|>\n<|assistant|>
        formatted_prompt = f"<|system|>\n{SYSTEM_PROMPT}<|end|>\n<|user|>\n{query}<|end|>\n<|assistant|>"
        
        try:
            result = self.generator(formatted_prompt)
            generated_text = result[0]['generated_text']
            
            # Extract only the assistant answer
            if "<|assistant|>" in generated_text:
                return generated_text.split("<|assistant|>")[-1].strip()
            return generated_text
            
        except Exception as e:
            print(f"Generation error: {e}")
            return "I apologize, but I encountered an error creating a response."
