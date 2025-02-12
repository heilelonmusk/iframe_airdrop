from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.1"

print(f"Downloading model: {MODEL_NAME}...")

# Scarica il modello e il tokenizer
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)

print("✅ Mistral 7B Downloaded Successfully!")