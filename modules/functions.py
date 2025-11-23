from modules.gemini import llm
from langchain_core.messages import HumanMessage, SystemMessage
import logging
import time

# Prompt do sistema
prompt_sistema = """
Você é o HeyDev, assistente virtual oficial do Programa Jovem Programador de Santa Catarina,
criado pelo SENAC e SEPROSC.

Use o conteúdo fornecido abaixo como base principal para suas respostas. 
Caso o contexto não contenha a informação solicitada, utilize seu conhecimento prévio 
para responder de forma correta sobre o Programa Jovem Programador.

Responda sobre: o programa, suas inscrições, requisitos, cidades participantes, cronograma, 
hackathon, curso oferecido e benefícios.

Explique o que for necessário para ajudar o usuário a entender o funcionamento do Programa.
Mantenha sempre o foco no Jovem Programador. Se a pergunta for sobre outro tema, 
explique gentilmente que foge do assunto.

Responda sempre em português do Brasil, com tom simpático, claro e natural.
Evite respostas muito longas (máximo 4 linhas).

"""

# Detecta respostas genéricas
def resposta_invalida(resposta: str) -> bool:
    sinais = [
        "não sei", "não tenho certeza", "não encontrei", "não posso responder",
        "desculpe", "não está claro", "não identifiquei", "não tenho dados"
    ]
    return any(sinal in resposta.lower() for sinal in sinais)

# Resume respostas longas
def resumir_resposta(texto: str) -> str:
    if len(texto) <= 500:
        return texto
    logging.info("✂️ Resposta longa — resumindo...")
    try:
        mensagens = [
            SystemMessage(content="Resuma o texto abaixo em até 4 linhas, mantendo o sentido e o tom."),
            HumanMessage(content=texto)
        ]
        resumo = llm.invoke(mensagens)
        return getattr(resumo, "content", str(resumo)).strip()
    except Exception as e:
        logging.error(f"Erro ao resumir: {e}")
        return texto[:500] + "..."

# Gera resposta com base no contexto
def responder_com_contexto(msg: str, contexto: str) -> str:
    inicio = time.time()
    try:
        mensagens = [
            SystemMessage(content=prompt_sistema),
            HumanMessage(
                content=(
                    f"Com base no contexto abaixo, responda de forma breve e direta.\n\n"
                    f"--- CONTEXTO ---\n{contexto.strip()}\n\n"
                    f"--- PERGUNTA ---\n{msg.strip()}"
                )
            )
        ]
        resposta = llm.invoke(mensagens)
        resposta_texto = getattr(resposta, "content", str(resposta)).strip()

        if resposta_invalida(resposta_texto):
            return (
                "🔍 Não encontrei essa informação com clareza no site oficial.<br>"
                "📞 Para mais detalhes, entre em contato com o SENAC: (48) 3341-9120."
            )

        resposta_final = resumir_resposta(resposta_texto)
        logging.info(f"✅ Resposta gerada em {time.time() - inicio:.2f}s")
        return resposta_final

    except Exception as e:
        logging.error(f"Erro no chatbot: {e}")
        return (
            "⚠️ Ops! Houve um problema temporário com o assistente.<br>"
            "Por favor, tente novamente em alguns segundos."
        )

# Lê o conteúdo de um arquivo
def ler_conteudo_arquivo(nome_arquivo: str) -> str:
    try:
        with open(nome_arquivo, "r", encoding="utf-8") as arquivo:
            return arquivo.read()
    except Exception as e:
        logging.error(f"Erro ao ler arquivo: {e}")
        return ""
