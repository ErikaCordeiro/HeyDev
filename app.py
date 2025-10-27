from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from scraping import extrair_paragrafos
from functions import responder_com_contexto, ler_conteudo_arquivo
import uvicorn
import asyncio
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# --- Cria o app primeiro ---
app = FastAPI()

# --- Adiciona o middleware CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Durante desenvolvimento, deixe assim
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Carregar variáveis de ambiente ---
load_dotenv()

print("🔑 Chave carregada:", os.getenv("GOOGLE_API_KEY"))

# --- Configurações ---
URLS_ALVO = [
    'https://www.jovemprogramador.com.br/',
    'https://www.jovemprogramador.com.br/hackathon',
    'https://www.jovemprogramador.com.br/hackathon/#regulamento',
    'https://www.jovemprogramador.com.br/hackathon/#noticias'
]
ARQUIVO_CONTEXTO = 'paragrafo_extraido.txt'
INTERVALO_ATUALIZACAO_SEGUNDOS = 24 * 60 * 60  # 24h

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# --- Função de scraping ---
def preparar_contexto(urls: list[str], arquivo_saida: str) -> str:
    print("Iniciando extração dos parágrafos das URLs...")
    paragrafos_unicos = set()
    for url in urls:
        try:
            parags = extrair_paragrafos(url)
            if parags:
                paragrafos_unicos.update(p.strip() for p in parags if p.strip())
        except Exception as e:
            print(f"Erro ao extrair parágrafos de {url}: {e}")
    if paragrafos_unicos:
        with open(arquivo_saida, 'w', encoding='utf-8') as f:
            f.write('\n\n'.join(sorted(list(paragrafos_unicos))))
        print(f'{len(paragrafos_unicos)} parágrafos únicos salvos em "{arquivo_saida}"')
        return ler_conteudo_arquivo(arquivo_saida)
    else:
        print("Nenhum parágrafo foi extraído.")
        return ""

# --- Carrega contexto inicial ---
if os.path.exists(ARQUIVO_CONTEXTO):
    print(f"Lendo contexto existente de '{ARQUIVO_CONTEXTO}'")
    CONTEUDO_CONTEXTO = ler_conteudo_arquivo(ARQUIVO_CONTEXTO)
else:
    CONTEUDO_CONTEXTO = preparar_contexto(URLS_ALVO, ARQUIVO_CONTEXTO)

# --- Atualização periódica ---
async def atualizar_contexto_periodicamente():
    global CONTEUDO_CONTEXTO
    while True:
        print("Atualizando contexto do JP automaticamente...")
        CONTEUDO_CONTEXTO = preparar_contexto(URLS_ALVO, ARQUIVO_CONTEXTO)
        await asyncio.sleep(INTERVALO_ATUALIZACAO_SEGUNDOS)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(atualizar_contexto_periodicamente())

# --- Rotas ---
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    pergunta = data.get("mensagem", "").strip()
    if not pergunta:
        return JSONResponse({"resposta": "Envie alguma pergunta para que eu possa ajudar 😉"})
    
    resposta = responder_com_contexto(pergunta, CONTEUDO_CONTEXTO)
    return JSONResponse({"resposta": resposta})

# --- Executar servidor ---
if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
