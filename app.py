from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from modules.scraping import extrair_paragrafos
from modules.functions import responder_com_contexto, ler_conteudo_arquivo
from modules.database import salvar_conversa, listar_conversas
import uvicorn
import asyncio
import os
import logging
from datetime import datetime, timedelta

# Logs
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")

# App FastAPI
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variáveis de ambiente
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
logging.info(f"Chave carregada: {API_KEY[:8] + '...' if API_KEY else 'NÃO ENCONTRADA'}")

# Configurações
URLS_ALVO = [
    "https://www.jovemprogramador.com.br/",
    "https://www.jovemprogramador.com.br/hackathon",
    "https://www.jovemprogramador.com.br/hackathon/#regulamento",
    "https://www.jovemprogramador.com.br/hackathon/#noticias"
]
ARQUIVO_CONTEXTO = "paragrafo_extraido.txt"
INTERVALO_ATUALIZACAO_SEGUNDOS = 24 * 60 * 60  # 24h

# Diretórios
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Verifica se o contexto é recente
def contexto_recente(arquivo: str) -> bool:
    if not os.path.exists(arquivo):
        return False
    mod_time = datetime.fromtimestamp(os.path.getmtime(arquivo))
    return datetime.now() - mod_time < timedelta(hours=24)

# Prepara o contexto
def preparar_contexto(urls: list[str], arquivo_saida: str) -> str:
    logging.info("Extraindo parágrafos das URLs...")
    paragrafos_unicos = set()
    for url in urls:
        try:
            parags = extrair_paragrafos(url)
            if parags:
                paragrafos_unicos.update(p.strip() for p in parags if p.strip())
        except Exception as e:
            logging.error(f"Erro ao extrair parágrafos de {url}: {e}")

    if paragrafos_unicos:
        with open(arquivo_saida, "w", encoding="utf-8") as f:
            f.write("\n\n".join(sorted(list(paragrafos_unicos))))
        logging.info(f"{len(paragrafos_unicos)} parágrafos salvos em '{arquivo_saida}'")
        return ler_conteudo_arquivo(arquivo_saida)
    else:
        logging.warning("Nenhum parágrafo foi extraído.")
        return ""

# Carrega o contexto inicial
if contexto_recente(ARQUIVO_CONTEXTO):
    logging.info(f"Lendo contexto existente de '{ARQUIVO_CONTEXTO}'")
    CONTEUDO_CONTEXTO = ler_conteudo_arquivo(ARQUIVO_CONTEXTO)
else:
    CONTEUDO_CONTEXTO = preparar_contexto(URLS_ALVO, ARQUIVO_CONTEXTO)

# Atualiza o contexto automaticamente
async def atualizar_contexto_periodicamente():
    global CONTEUDO_CONTEXTO
    while True:
        logging.info("Atualizando contexto automaticamente...")
        CONTEUDO_CONTEXTO = preparar_contexto(URLS_ALVO, ARQUIVO_CONTEXTO)
        await asyncio.sleep(INTERVALO_ATUALIZACAO_SEGUNDOS)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(atualizar_contexto_periodicamente())

# Página inicial
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Chat
@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    pergunta = data.get("mensagem", "").strip()
    if not pergunta:
        return JSONResponse({"resposta": "Envie alguma pergunta para que eu possa ajudar 😉"})
    
    resposta = responder_com_contexto(pergunta, CONTEUDO_CONTEXTO)
    try:
        salvar_conversa("Usuário", pergunta, resposta)
        logging.info("Conversa salva no banco.")
    except Exception as e:
        logging.error(f"Erro ao salvar no banco: {e}")

    return JSONResponse({"resposta": resposta})

# Histórico
@app.get("/historico")
async def historico():
    try:
        conversas = listar_conversas(10)
        historico_formatado = [
            {"usuario": c[0], "pergunta": c[1], "resposta": c[2], "data_hora": c[3]}
            for c in conversas
        ]
        return JSONResponse({"historico": historico_formatado})
    except Exception as e:
        logging.error(f"Erro ao carregar histórico: {e}")
        return JSONResponse({"erro": f"Erro ao carregar histórico: {e}"})

# Executar
if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
