// === CONFIGURAÇÃO GLOBAL ===
// Altere esta linha com o link da sua API hospedada no Render:
const API_URL = "https://heydev-m70h.onrender.com";

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
  const headerButtons = document.querySelector(".header-buttons") || document.querySelector(".chat-header");
  if (headerButtons) headerButtons.appendChild(botaoSom);
}

// =================== ACESSIBILIDADE ===================
let lastFocused = null;
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input[type='text']:not([disabled])",
  "input[type='search']:not([disabled])",
  "input[type='radio']:not([disabled])",
  "input[type='checkbox']:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

function trapFocus(e) {
  if (e.key !== "Tab") return;
  const focusables = chatBox.querySelectorAll(FOCUSABLE);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

// =================== ABRIR / FECHAR CHAT ===================
function abrirChat() {
  lastFocused = document.activeElement;
  chatBox.style.display = "flex";
  chatBox.setAttribute("aria-hidden", "false");
  document.addEventListener("keydown", trapFocus);
  document.addEventListener("keydown", escHandler);
  setTimeout(() => inputMsg?.focus(), 150);

  if (!chatBox.classList.contains("iniciou")) {
    chatBox.classList.add("iniciou");
    enviarMensagemComDigitando("👋 Olá! Eu sou o HeyDev, seu assistente do programa Jovem Programador.", 400);
    enviarMensagemComDigitando("💡 Posso te ajudar com informações sobre o curso, inscrições ou até curiosidades sobre o programa.", 2100);
    enviarMensagemComDigitando("✨ Então, por onde quer começar?", 4000, () => {
      renderQuickReplies([
        "📚 Sobre o programa",
        "📝 Inscrições",
        "💬 Contato"
      ]);
    });
  }
}

function fecharChat() {
  chatBox.style.display = "none";
  chatBox.setAttribute("aria-hidden", "true");
  speechSynthesis.cancel();
  botFalando = false;
  document.removeEventListener("keydown", trapFocus);
  document.removeEventListener("keydown", escHandler);
  if (lastFocused) lastFocused.focus();
}

function escHandler(e) {
  if (e.key === "Escape") fecharChat();
}

chatBtn?.addEventListener("click", () => {
  const aberto = chatBox.style.display === "flex";
  aberto ? fecharChat() : abrirChat();
});
closeBtn?.addEventListener("click", fecharChat);

// =================== SOM LIGA/DESLIGA ===================
botaoSom.addEventListener("click", () => {
  vozAtiva = !vozAtiva;
  botaoSom.textContent = vozAtiva ? "🔊" : "🔇";
  if (!vozAtiva) {
    speechSynthesis.cancel();
    botFalando = false;
  }
});

// =================== UTIL: mensagens e "digitando" ===================
function adicionarMensagem(texto, remetente) {
  const div = document.createElement("div");
  div.classList.add(remetente === "usuario" ? "mensagem-usuario" : "mensagem-bot");

  if (remetente === "bot") {
    div.setAttribute("role", "status");
    const maxLength = 400;
    if (texto.length > maxLength) {
      const resumo = texto.slice(0, maxLength) + "...";
      div.innerHTML = `<span class="resposta-curta">${resumo}</span>
                       <button class="ver-mais" aria-label="Expandir resposta">ver mais</button>`;
      const btn = div.querySelector(".ver-mais");
      btn.addEventListener("click", () => {
        const curta = div.querySelector(".resposta-curta");
        const expandindo = btn.textContent === "ver mais";
        curta.innerHTML = expandindo ? texto : resumo;
        btn.textContent = expandindo ? "ver menos" : "ver mais";
        btn.setAttribute("aria-label", expandindo ? "Recolher resposta" : "Expandir resposta");
      });
    } else {
      div.innerHTML = texto;
    }

    if (vozAtiva) {
      if (speechSynthesis.speaking) speechSynthesis.cancel();
      if (!botFalando) {
        botFalando = true;
        const textoLimpo = div.textContent.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "");
        const fala = new SpeechSynthesisUtterance(textoLimpo);
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

function mostrarDigitando() {
  const div = document.createElement("div");
  div.classList.add("mensagem-bot", "digitando");
  div.setAttribute("role", "status");
  div.textContent = "Digitando.";
  mensagens.appendChild(div);
  mensagens.scrollTo({ top: mensagens.scrollHeight, behavior: "smooth" });
  return div;
}

function enviarMensagemComDigitando(texto, atraso = 400, callback) {
  setTimeout(() => {
    const d = mostrarDigitando();
    setTimeout(() => {
      d.remove();
      adicionarMensagem(texto, "bot");
      if (typeof callback === "function") callback();
    }, 1100);
  }, atraso);
}

// =================== ENVIO DE MENSAGEM ===================
async function enviarMensagem() {
  const texto = inputMsg.value.trim();
  if (!texto) return;
  adicionarMensagem(texto, "usuario");
  inputMsg.value = "";

  const digitandoDiv = mostrarDigitando();

  try {
    const resposta = await fetch(`${API_URL}/chat`, {
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

// Envio por clique e teclado
enviarBtn?.addEventListener("click", enviarMensagem);
inputMsg?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    enviarMensagem();
  }
});

// =================== RECONHECIMENTO DE VOZ ===================
if ("webkitSpeechRecognition" in window) {
  const reconhecimento = new webkitSpeechRecognition();
  reconhecimento.lang = "pt-BR";
  reconhecimento.continuous = false;
  reconhecimento.interimResults = false;

  microfoneBtn?.addEventListener("click", () => {
    reconhecimento.start();
    microfoneBtn.textContent = "🎙️";
    microfoneBtn.classList.add("ativo");
    tocarSom(880);
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
    microfoneBtn.classList.remove("ativo");
    tocarSom(440);
  };
} else {
  microfoneBtn.disabled = true;
  microfoneBtn.title = "Seu navegador não suporta reconhecimento de voz.";
}

// =================== QUICK REPLIES ===================
function renderQuickReplies(labels = []) {
  mensagens.querySelectorAll(".quick-replies").forEach((n) => n.remove());
  const group = document.createElement("div");
  group.className = "quick-replies";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Sugestões rápidas");

  labels.forEach((label) => {
    const btn = document.createElement("button");
    btn.className = "quick-reply";
    btn.type = "button";
    btn.textContent = label;
    btn.setAttribute("aria-label", `Perguntar: ${label.replace(/^[^a-zA-ZÀ-ÿ]+/, "")}`);
    group.appendChild(btn);
  });

  mensagens.appendChild(group);
  mensagens.scrollTo({ top: mensagens.scrollHeight, behavior: "smooth" });
}

mensagens?.addEventListener("click", (e) => {
  const btn = e.target.closest(".quick-reply");
  if (!btn) return;
  const texto = btn.textContent.replace(/^[^a-zA-ZÀ-ÿ]+/, "");
  inputMsg.value = texto;
  enviarMensagem();
});

// =================== INTEGRAÇÃO COM A LANDING PAGE ===================
const botoes = [
  document.getElementById("btn-comecar"),
  document.getElementById("btn-experimentar"),
  document.getElementById("btn-comecar2"),
];
botoes.forEach((btn) => {
  if (btn) btn.addEventListener("click", abrirChat);
});

const btnSaibaMais = document.querySelector(".btn-secondary");
if (btnSaibaMais) {
  btnSaibaMais.addEventListener("click", () => {
    window.scrollTo({ top: document.body.scrollHeight / 2, behavior: "smooth" });
  });
}

// =================== SOM (BEEPS) ===================
function tocarSom(frequencia) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequencia;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
  osc.stop(ctx.currentTime + 0.25);
}
