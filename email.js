// Página do e-mail ao M1 — texto editável com salvamento local.
// As edições ficam no localStorage do navegador; não alteram o .docx do entregável.

const ORIGINAL = `<p>Hi [Name],</p>

<p>Thank you for raising this. Your read is correct and here is what we found.</p>

<p>Between September and December, M1's approval rate dropped sharply — from around 68% to 52% — driven entirely by declines for Card Status (an invalid card credential).</p>

<p>The key clue: <strong>brand-new customers — entering a card for the first time — were hit just as hard as renewals</strong>. A freshly entered card cannot be an outdated stored credential, so the cause points to something in how M1's transactions are being submitted to us since late September.</p>

<p>I'd like to ask if your team could check whether anything changed around <strong>29th of September 2025</strong>. For example:</p>

<ul>
<li>a change of gateway, acquirer or payment service provider, or a new routing rule;</li>
<li>a version or configuration change in the payment integration;</li>
<li>changes to the authorization message fields — token, expiry date, CVV, or stored-credential indicators;</li>
<li>a migration of stored credentials.</li>
</ul>

<p>Regarding <strong>next steps</strong>, on our side, we are reviewing your authorization logs around 29 September and adding per-merchant approval alerting — this ran for three months before it surfaced, and that part is on us.</p>

<p>Could we take 45 minutes with both payments teams to work through the checklist together?</p>

<p>I just sent a calendar invitation for this Thursday at 09am; let me know if another day/time works better for you.</p>

<p>Best regards,<br>
<strong>Fernando Gil</strong><br>
Authorization Team<br>
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
  const subject = "M1 approval rates — what we found and how can we move forward";
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
