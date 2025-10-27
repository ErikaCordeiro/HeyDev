from dotenv import load_dotenv
import os
from langchain_google_genai import ChatGoogleGenerativeAI
import requests


# Carrega a chave da API
load_dotenv()
gemini_api_key = os.getenv("GOOGLE_API_KEY")

if not gemini_api_key:
    raise ValueError("Chave GOOGLE_API_KEY não encontrada no arquivo .env.")

# ✅ Modelo compatível e gratuito
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",  # modelo mais recente e suportado
    google_api_key=gemini_api_key,
    temperature=0.3
)

