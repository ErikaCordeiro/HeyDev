const chatBtn = document.getElementById("chatBtn");
const chatBox = document.getElementById("chatBox");
const closeBtn = document.getElementById("closeBtn");
const enviarBtn = document.getElementById("enviar");
const inputMsg = document.getElementById("inputMsg");
const mensagens = document.getElementById("mensagens");
const microfoneBtn = document.getElementById("microfone");

// 🔊 Controle de voz
let botFalando = false;
let vozAtiva = true;

// Botão de som (🔊 / 🔇)
let botaoSom = document.getElementById("botaoSom");
if (!botaoSom) {
  botaoSom = document.createElement("button");
  botaoSom.id = "botaoSom";
  botaoSom.textContent = "🔊";
  botaoSom.setAttribute("aria-label", "Ativar/Desativar som");
  botaoSom.title = "Ativar/Desativar som";

  const headerButtons = document.querySelector(".header-buttons");
  if (headerButtons) {
    headerButtons.appendChild(botaoSom);
  } else {
    const chatHeader = document.querySelector(".chat-header");
    if (chatHeader) chatHeader.appendChild(botaoSom);
  }
}

// Abre/fecha o chat
chatBtn.addEventListener("click", () => {
  const aberto = chatBox.style.display === "flex";
  chatBox.style.display = aberto ? "none" : "flex";
  if (!aberto) inputMsg.focus(); // foco automático no campo ao abrir
});

closeBtn.addEventListener("click", () => {
  chatBox.style.display = "none";
  speechSynthesis.cancel(); // 🔇 para de falar ao fechar
  botFalando = false;
});

// Liga/desliga a voz do bot
botaoSom.addEventListener("click", () => {
  vozAtiva = !vozAtiva;
  botaoSom.textContent = vozAtiva ? "🔊" : "🔇";
  if (!vozAtiva) {
    speechSynthesis.cancel();
    botFalando = false;
  }
});

// Adiciona mensagem no chat
function adicionarMensagem(texto, remetente) {
  const div = document.createElement("div");
  div.classList.add(remetente === "usuario" ? "mensagem-usuario" : "mensagem-bot");

  if (remetente === "bot") {
    // Texto longo: botão "ver mais"
    const maxLength = 400;
    if (texto.length > maxLength) {
      const resumo = texto.slice(0, maxLength) + "...";
      div.innerHTML = `<span class="resposta-curta">${resumo}</span>
                       <button class="ver-mais">ver mais</button>`;
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

    // 🎧 Controle de voz
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

// Mostra "digitando..."
function mostrarDigitando() {
  const div = document.createElement("div");
  div.classList.add("mensagem-bot", "digitando");
  div.textContent = "Digitando...";
  mensagens.appendChild(div);
  mensagens.scrollTo({ top: mensagens.scrollHeight, behavior: "smooth" });
  return div;
}

// Envia mensagem para o backend
async function enviarMensagem() {
  const texto = inputMsg.value.trim();
  if (!texto) return;
  adicionarMensagem(texto, "usuario");
  inputMsg.value = "";

  const digitandoDiv = mostrarDigitando();

  try {
    const resposta = await fetch("http://127.0.0.1:8000/chat", {
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

// Eventos de envio
enviarBtn.addEventListener("click", enviarMensagem);
inputMsg.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    enviarMensagem();
  }
});

// 🎤 Entrada de voz
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
