const form = document.getElementById("form");
const input = document.getElementById("q");
const send = document.getElementById("send");
const box = document.getElementById("resposta");
const status = document.getElementById("status");

// chips de exemplo preenchem o campo
document.getElementById("chips").addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    input.value = e.target.textContent;
    input.focus();
  }
});

// ===== entrada por voz (reconhecimento nativo do navegador) =====
const mic = document.getElementById("mic");
const micHint = document.getElementById("micHint");
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SR) {
  // só mostra o microfone se o navegador souber reconhecer voz
  mic.hidden = false;
  micHint.hidden = false;

  const rec = new SR();
  rec.lang = "pt-BR";
  rec.interimResults = true;
  rec.continuous = false;
  let ouvindo = false;
  let finalTxt = "";

  const parar = () => { mic.classList.remove("rec"); ouvindo = false; };

  mic.addEventListener("click", () => {
    if (ouvindo) { rec.stop(); return; }
    finalTxt = "";
    input.value = "";
    try { rec.start(); } catch (_) { /* start duplo, ignora */ }
  });

  rec.onstart = () => {
    ouvindo = true;
    mic.classList.add("rec");
    status.textContent = "Ouvindo… fale a pergunta.";
  };

  rec.onresult = (ev) => {
    let interim = "";
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const txt = ev.results[i][0].transcript;
      if (ev.results[i].isFinal) finalTxt += txt;
      else interim += txt;
    }
    input.value = (finalTxt + interim).trim();
  };

  rec.onerror = (ev) => {
    parar();
    status.textContent = ev.error === "not-allowed"
      ? "Permita o acesso ao microfone para usar a voz."
      : "Não consegui ouvir. Tente de novo ou digite.";
  };

  rec.onend = () => {
    parar();
    const pergunta = input.value.trim();
    if (pergunta) {
      // envia sozinho, como se você tivesse apertado "Perguntar"
      form.requestSubmit();
    } else {
      status.textContent = "Pronto.";
    }
  };
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const pergunta = input.value.trim();
  if (!pergunta) return;

  send.disabled = true;
  status.textContent = "O agente está pensando…";
  box.hidden = false;
  box.className = "resposta pensando";
  box.textContent = "Lendo o banco e analisando…";

  try {
    const r = await fetch("/api/perguntar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pergunta }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.erro || "Erro " + r.status);
    box.className = "resposta";
    box.textContent = data.resposta;
    status.textContent = "Resposta gerada com dados lidos ao vivo do Supabase.";
  } catch (err) {
    box.className = "resposta erro";
    box.textContent = "⚠️ " + err.message;
    status.textContent = "Falhou.";
  } finally {
    send.disabled = false;
  }
});
