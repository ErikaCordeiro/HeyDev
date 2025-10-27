import requests
from bs4 import BeautifulSoup
from requests.exceptions import RequestException # Importar para tratamento de exceções
 
def extrair_paragrafos(url_alvo: str) -> list[str]: # Renomeado para clareza e adicionado type hint
 
    paragrafos_extraidos = []
 
    try:
        # Usar o parâmetro url_alvo e adicionar um timeout
        response = requests.get(url_alvo, timeout=10)
        response.raise_for_status()  # Levanta um erro para códigos de status HTTP ruins (4xx ou 5xx)
    except RequestException as e:
        print(f"Erro ao acessar a URL {url_alvo}: {e}")
        return paragrafos_extraidos # Retorna lista vazia em caso de erro de requisição
 
    # 1. Criar o objeto BeautifulSoup PRIMEIRO
    dados_pagina = BeautifulSoup(response.text, 'html.parser')
 
    # 2. Encontrar todos os elementos <p> na página
    tags_paragrafo_encontradas = dados_pagina.find_all('p')
 
    # 3. Iterar e extrair o texto dos parágrafos
    for paragrafo_tag in tags_paragrafo_encontradas:
        if paragrafo_tag and paragrafo_tag.text: # Verifica se a tag e seu texto existem
            texto_limpo = paragrafo_tag.text.strip() # Remove espaços em branco extras
            if texto_limpo: # Adiciona apenas se não for uma string vazia após o strip
                paragrafos_extraidos.append(texto_limpo)
    return paragrafos_extraidos
 