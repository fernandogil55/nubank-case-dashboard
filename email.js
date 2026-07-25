// Página do e-mail ao M1 — texto editável com salvamento local.
// As edições ficam no localStorage do navegador; não alteram o .docx do entregável.

const ORIGINAL = `<p>Hi [Name],</p>

<p>Thank you for raising this — your read is correct, and here is what we found.</p>

<h3>What happened</h3>

<p>Between September and December, M1's approval rate dropped sharply — from around 68% to 52% — driven entirely by declines for <strong>Card Status</strong> (an invalid card credential). For you, that is roughly a <strong>22% drop in processed revenue</strong>.</p>

<h3>What we found</h3>

<p>We ruled out a retry pattern, a Nubank-wide event, seasonality and an outage. The key clue: <strong>brand-new customers — entering a card for the first time — were hit just as hard as renewals</strong>. A freshly entered card cannot be an outdated stored credential, so the cause points to something in how M1's transactions are being submitted to us since late September.</p>

<h3>What we would like to ask</h3>

<p>Could your team check whether anything changed around <strong>29 September</strong>?</p>

<ul>
<li>a change of gateway, acquirer or payment service provider, or a new routing rule;</li>
<li>a version or configuration change in the payment integration;</li>
<li>changes to the authorization message fields — token or PAN format, expiry date, CVV, or stored-credential indicators;</li>
<li>a migration of stored credentials.</li>
</ul>

<h3>Next steps</h3>

<p>On our side, we are reviewing your authorization logs around 29 September and adding per-merchant approval alerting — this ran for three months before it surfaced, and that part is on us. Could we take 45 minutes this week with both payments teams to work through the checklist together? I will send an invitation for Thursday unless another day is better.</p>

<p>Best regards,<br>
<strong>Fernando Gil</strong><br>
Authorization Team · Merchant Business Support<br>
Nubank</p>`;

const KEY = "email_m1_draft_v1";
const el = document.getElementById("mail");
const saved = document.getElementById("saved");

function load() {
  const stored = localStorage.getItem(KEY);
  el.innerHTML = stored ?? ORIGINAL;
  flag(stored ? "Rascunho salvo neste navegador" : "Texto original");
}
function flag(msg, ok) {
  saved.textContent = msg;
  saved.className = "saved" + (ok ? " on" : "");
}

let timer;
el.addEventListener("input", () => {
  clearTimeout(timer);
  flag("Digitando…");
  timer = setTimeout(() => {
    localStorage.setItem(KEY, el.innerHTML);
    flag("✓ Salvo " + new Date().toLocaleTimeString("pt-BR"), true);
  }, 700);
});

// texto puro, para copiar/baixar
function plain() {
  const c = el.cloneNode(true);
  c.querySelectorAll("li").forEach(li => (li.textContent = "- " + li.textContent));
  c.querySelectorAll("br").forEach(br => br.replaceWith("\n"));
  return c.innerText.replace(/\n{3,}/g, "\n\n").trim();
}

document.getElementById("copy").onclick = async () => {
  const subject = "M1 approval rates — what we found, and one question for your team";
  await navigator.clipboard.writeText("Subject: " + subject + "\n\n" + plain());
  flag("✓ Copiado para a área de transferência", true);
};

document.getElementById("download").onclick = () => {
  const blob = new Blob([plain()], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "email_merchant_m1.txt";
  a.click();
  URL.revokeObjectURL(a.href);
  flag("✓ Arquivo baixado", true);
};

document.getElementById("reset").onclick = () => {
  if (!confirm("Descartar suas edições e voltar ao texto original?")) return;
  localStorage.removeItem(KEY);
  el.innerHTML = ORIGINAL;
  flag("Texto original restaurado");
};

load();
