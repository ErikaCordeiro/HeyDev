from gemini import llm
from langchain_core.messages import HumanMessage, SystemMessage

prompt_sistema = """
Você é o assistente virtual oficial do Programa Jovem Programador de Santa Catarina,
uma iniciativa do SENAC e do SEPROSC.

Seu papel é responder perguntas com base nas informações extraídas do site oficial
(https://www.jovemprogramador.com.br/).

INSTRUÇÕES:
- Responda apenas sobre: inscrições, requisitos, cidades participantes, cronograma,
  hackathon, benefícios, ou informações relacionadas ao programa.
- NÃO invente respostas.
- Se a pergunta for fora do tema, responda de forma educada que não tem relação com o Jovem Programador.
- Sempre use uma linguagem clara, objetiva e em português do Brasil.
"""

def resposta_invalida(resposta: str) -> bool:
    sinais = [
        "não sei", "não tenho certeza", "não encontrei essa informação",
        "não posso responder", "desculpe", "não está claro", "não identifiquei"
    ]
    resposta_lower = resposta.lower()
    return any(sinal in resposta_lower for sinal in sinais)

def responder_com_contexto(msg: str, contexto: str) -> str:
    try:
        mensagens = [
            SystemMessage(content=prompt_sistema),
            HumanMessage(content=f"Com base no contexto abaixo, responda à pergunta do usuário.\n\n--- CONTEXTO ---\n{contexto.strip()}\n\n--- PERGUNTA ---\n{msg.strip()}")
        ]
        resposta = llm.invoke(mensagens)
        resposta_texto = getattr(resposta, "content", str(resposta)).strip()
        if resposta_invalida(resposta_texto):
            return "🔍 Não encontrei essa informação com clareza no site oficial.\n📞 Para mais detalhes, entre em contato com o SENAC: (48) 3341-9120."
        return resposta_texto
    except Exception as e:
        print(f"⚠️ Erro interno no chatbot: {e}")
        return "⚠️ Ops! Houve um problema temporário com o assistente.\nPor favor, tente novamente em alguns segundos."

def ler_conteudo_arquivo(nome_arquivo: str) -> str:
    try:
        with open(nome_arquivo, "r", encoding="utf-8") as arquivo:
            return arquivo.read()
    except Exception as e:
        print(f"Erro ao ler o arquivo: {e}")
        return ""
