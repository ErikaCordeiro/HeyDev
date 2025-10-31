import sqlite3
from datetime import datetime

DB_NAME = "chatbot.db"

# Conecta ao banco e cria a tabela se não existir
def conectar():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT,
            pergunta TEXT,
            resposta TEXT,
            data_hora TEXT
        )
    """)
    conn.commit()
    return conn

# Salva uma conversa
def salvar_conversa(usuario: str, pergunta: str, resposta: str):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO conversas (usuario, pergunta, resposta, data_hora)
        VALUES (?, ?, ?, ?)
    """, (usuario, pergunta, resposta, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
    conn.commit()
    conn.close()

# Lista as últimas conversas
def listar_conversas(limit=10):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT usuario, pergunta, resposta, data_hora
        FROM conversas
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    resultados = cursor.fetchall()
    conn.close()
    return resultados
