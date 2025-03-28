from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
from typing import List, Tuple

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in .env file. Please set it.")

genai.configure(api_key=api_key)
tuned_model_name = 'tunedModels/empatheticbot-htv1uagdnucc'
model = genai.get_tuned_model(tuned_model_name)
generative_model = genai.GenerativeModel(model_name=model.name)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  
)

class ChatRequest(BaseModel):
    prompt: str
    history: List[Tuple[str, str]] = []

conversation_history: List[Tuple[str, str]] = []

@app.post("/chat")
async def generate_chat_response(request: ChatRequest):
    try:
        history = request.history if request.history else conversation_history
        
        context = "\n".join([f"User: {u}\nAssistant: {a}" for u, a in history])
        full_prompt = f"{context}\nUser: {request.prompt}\nAssistant:"

        response = generative_model.generate_content(
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                candidate_count=1,
                max_output_tokens=250,
            ),
            stream=False,
        )

        response_text = response.text

        conversation_history.append((request.prompt, response_text))
        if len(conversation_history) > 5:
            conversation_history.pop(0)

        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}