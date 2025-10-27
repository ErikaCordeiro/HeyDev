const chatBtn = document.getElementById("chatBtn");
const chatBox = document.getElementById("chatBox");
const closeBtn = document.getElementById("closeBtn");
const enviarBtn = document.getElementById("enviar");
const inputMsg = document.getElementById("inputMsg");
const mensagens = document.getElementById("mensagens");

chatBtn.addEventListener("click", () => {
  chatBox.style.display = chatBox.style.display === "none" || chatBox.style.display === "" ? "flex" : "none";
});

closeBtn.addEventListener("click", () => { chatBox.style.display = "none"; });

function adicionarMensagem(texto, remetente) {
  const div = document.createElement("div");
  div.classList.add(remetente === "usuario" ? "mensagem-usuario" : "mensagem-bot");
  div.textContent = texto;
  mensagens.appendChild(div);
  mensagens.scrollTop = mensagens.scrollHeight;
}

async function enviarMensagem() {
  const texto = inputMsg.value.trim();
  if (!texto) return;
  adicionarMensagem(texto, "usuario");
  inputMsg.value = "";
  try {
    const resposta = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: texto })
    });
    if (!resposta.ok) throw new Error("Erro ao conectar com o servidor");
    const data = await resposta.json();
    adicionarMensagem(data.resposta, "bot");
  } catch (error) {
    adicionarMensagem("⚠️ Erro: não foi possível conectar ao servidor.", "bot");
    console.error(error);
  }
}

enviarBtn.addEventListener("click", enviarMensagem);
inputMsg.addEventListener("keypress", e => { if (e.key === "Enter") { e.preventDefault(); enviarMensagem(); } });
