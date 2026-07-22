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
