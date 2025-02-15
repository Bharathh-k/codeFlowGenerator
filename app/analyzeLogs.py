import requests
import json
from pymongo import MongoClient

# MongoDB connection
MONGO_URI = "mongodb+srv://bharathkgit:<password>@cluster0.4m5vg.mongodb.net/"
client = MongoClient(MONGO_URI)
db = client["API"]
collection = db["apiLogs"]

# OpenRouter API details
OPENROUTER_API_KEY = ""

def fetch_error_logs():
    """Fetch error logs from MongoDB"""
    logs = list(collection.find({"status": "error"}, {"_id": 0}))  # Get all error logs
    if not logs:
        return "No error logs found."

    log_text = "\n".join([json.dumps(log, indent=2) for log in logs])  # Format logs
    return f"Analyze these logs and if there are any error messages, give most possible fixes in the fewest words possible:\n\n{log_text}"

def analyze_logs_with_genAI():
    """Send logs to OpenRouter AI and get analysis"""
    logs_prompt = fetch_error_logs()
    
    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        data=json.dumps({
            "model": "deepseek/deepseek-r1-distill-llama-70b:free",
            "messages": [
                {
                    "role": "user",
                    "content": logs_prompt
                }
            ],
        })
    )

    if response.status_code == 200:
        ai_response = response.json()["choices"][0]["message"]["content"]
        return ai_response
    else:
        return f"Error: {response.status_code}, {response.text}"

if __name__ == "__main__":
    result = analyze_logs_with_genAI()
    print("\n💡 AI Analysis & Fixes:\n", result)
