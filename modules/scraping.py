import requests
from bs4 import BeautifulSoup
from requests.exceptions import RequestException

# Extrai os parágrafos de uma página
def extrair_paragrafos(url_alvo: str) -> list[str]:
    paragrafos = []
    try:
        response = requests.get(url_alvo, timeout=10)
        response.raise_for_status()
    except RequestException as e:
        print(f"Erro ao acessar a URL {url_alvo}: {e}")
        return paragrafos

    soup = BeautifulSoup(response.text, "html.parser")
    for p in soup.find_all("p"):
        texto = p.get_text(strip=True)
        if texto:
            paragrafos.append(texto)
    return paragrafos
