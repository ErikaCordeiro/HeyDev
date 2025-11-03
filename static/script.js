// === ELEMENTOS DO CHAT ===
const chatBtn = document.getElementById("chatBtn");
const chatBox = document.getElementById("chatBox");
const closeBtn = document.getElementById("closeBtn");
const enviarBtn = document.getElementById("enviar");
const inputMsg = document.getElementById("inputMsg");
const mensagens = document.getElementById("mensagens");
const microfoneBtn = document.getElementById("microfone");

// === CONTROLE DE VOZ ===
let botFalando = false;
let vozAtiva = true;

// === BOTÃO DE SOM ===
let botaoSom = document.getElementById("botaoSom");
if (!botaoSom) {
  botaoSom = document.createElement("button");
  botaoSom.id = "botaoSom";
  botaoSom.textContent = "🔊";
  botaoSom.setAttribute("aria-label", "Ativar/Desativar som");
  botaoSom.title = "Ativar/Desativar som";
  const headerButtons = document.querySelector(".header-buttons");
  if (headerButtons) headerButtons.appendChild(botaoSom);
  else {
    const chatHeader = document.querySelector(".chat-header");
    if (chatHeader) chatHeader.appendChild(botaoSom);
  }
}

// === ABRIR / FECHAR CHAT ===
function abrirChat() {
  chatBox.style.display = "flex";
  setTimeout(() => inputMsg.focus(), 200);
}

function fecharChat() {
  chatBox.style.display = "none";
  speechSynthesis.cancel();
  botFalando = false;
}

chatBtn.addEventListener("click", () => {
  const aberto = chatBox.style.display === "flex";
  aberto ? fecharChat() : abrirChat();
});

closeBtn.addEventListener("click", fecharChat);

// === LIGAR / DESLIGAR VOZ ===
botaoSom.addEventListener("click", () => {
  vozAtiva = !vozAtiva;
  botaoSom.textContent = vozAtiva ? "🔊" : "🔇";
  if (!vozAtiva) {
    speechSynthesis.cancel();
    botFalando = false;
  }
});

// === ADICIONAR MENSAGEM ===
function adicionarMensagem(texto, remetente) {
  const div = document.createElement("div");
  div.classList.add(remetente === "usuario" ? "mensagem-usuario" : "mensagem-bot");

  if (remetente === "bot") {
    const maxLength = 400;
    if (texto.length > maxLength) {
      const resumo = texto.slice(0, maxLength) + "...";
      div.innerHTML = `<span class="resposta-curta">${resumo}</span>
                       <button class="ver-mais" aria-label="Ver mais">ver mais</button>`;
      const btn = div.querySelector(".ver-mais");
      btn.addEventListener("click", () => {
        const curta = div.querySelector(".resposta-curta");
        if (btn.textContent === "ver mais") {
          curta.innerHTML = texto;
          btn.textContent = "ver menos";
        } else {
          curta.innerHTML = resumo;
          btn.textContent = "ver mais";
        }
      });
    } else {
      div.innerHTML = texto;
    }

    // 🎧 FALA DO BOT
    if (vozAtiva) {
      if (speechSynthesis.speaking) speechSynthesis.cancel();
      if (!botFalando) {
        botFalando = true;
        const fala = new SpeechSynthesisUtterance(div.textContent);
        fala.lang = "pt-BR";
        fala.rate = 1;
        fala.pitch = 1;
        fala.onend = () => (botFalando = false);
        fala.onerror = () => (botFalando = false);
        speechSynthesis.speak(fala);
      }
    }
  } else {
    div.textContent = texto;
  }

  mensagens.appendChild(div);
  mensagens.scrollTo({ top: mensagens.scrollHeight, behavior: "smooth" });
}

// === MOSTRAR "DIGITANDO..." ===
function mostrarDigitando() {
  const div = document.createElement("div");
  div.classList.add("mensagem-bot", "digitando");
  div.textContent = "Digitando...";
  mensagens.appendChild(div);
  mensagens.scrollTo({ top: mensagens.scrollHeight, behavior: "smooth" });
  return div;
}

// === ENVIAR MENSAGEM ===
async function enviarMensagem() {
  const texto = inputMsg.value.trim();
  if (!texto) return;
  adicionarMensagem(texto, "usuario");
  inputMsg.value = "";

  const digitandoDiv = mostrarDigitando();

  try {
    const resposta = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: texto }),
    });

    digitandoDiv.remove();

    if (!resposta.ok) throw new Error("Erro ao conectar com o servidor");
    const data = await resposta.json();
    adicionarMensagem(data.resposta, "bot");
  } catch (error) {
    digitandoDiv.remove();
    adicionarMensagem("⚠️ Erro: não foi possível conectar ao servidor.", "bot");
    console.error(error);
  }
}

// === EVENTOS DE ENVIO ===
enviarBtn.addEventListener("click", enviarMensagem);
inputMsg.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    enviarMensagem();
  }
});

// === RECONHECIMENTO DE VOZ ===
if ("webkitSpeechRecognition" in window) {
  const reconhecimento = new webkitSpeechRecognition();
  reconhecimento.lang = "pt-BR";
  reconhecimento.continuous = false;
  reconhecimento.interimResults = false;

  microfoneBtn.addEventListener("click", () => {
    reconhecimento.start();
    microfoneBtn.textContent = "🎙️";
  });

  reconhecimento.onresult = (event) => {
    const texto = event.results[0][0].transcript;
    inputMsg.value = texto;
    enviarMensagem();
  };

  reconhecimento.onerror = (event) => {
    console.error("Erro no reconhecimento de voz:", event.error);
    adicionarMensagem("⚠️ Não consegui te ouvir, tente novamente.", "bot");
  };

  reconhecimento.onend = () => {
    microfoneBtn.textContent = "🎤";
  };
} else {
  microfoneBtn.disabled = true;
  microfoneBtn.title = "Seu navegador não suporta reconhecimento de voz.";
}

// === NOVO: INTEGRAR BOTÕES DO SITE ===
const btnExperimentar = document.querySelector(".btn-primary");
if (btnExperimentar) {
  btnExperimentar.addEventListener("click", abrirChat);
}

const btnSaibaMais = document.querySelector(".btn-secondary");
if (btnSaibaMais) {
  btnSaibaMais.addEventListener("click", () => {
    window.scrollTo({ top: document.body.scrollHeight / 2, behavior: "smooth" });
  });
}
