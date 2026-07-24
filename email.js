// Página do e-mail ao M1 — texto editável com salvamento local.
// As edições ficam no localStorage do navegador; não alteram o .docx do entregável.

const ORIGINAL = `<p>Hi [Name],</p>

<p>Thank you for raising this. Your read is correct, and I want to share what we found and where we need your help.</p>

<h3>What the data shows</h3>

<p>Approval was stable between 66% and 70% from January through September. It then fell to 58.5% in October, 52.8% in November and 52.2% in December. On a weekly view the change is abrupt rather than gradual — 68.1% in the week ending 28 September, 53.9% the following week.</p>

<p>The entire movement comes from a single decline reason: <strong>Card Status</strong>, meaning the card credential reaching us is not valid for the transaction. It went from 24.2% of your attempts in September to 41.0% in December, while declines for insufficient limit and for fraud risk stayed flat. On your side, processed revenue fell from roughly R$ 37.0k per month to R$ 28.7k in December — a 22% reduction in run rate.</p>

<h3>What points to the cause</h3>

<p>We split your traffic into renewals and first-ever charges for customers new to your service. Both were hit with the same intensity: Card Status declines rose from 21.4% to 39.5% for new customers, and from 24.7% to 37.2% for renewals.</p>

<p>This is the detail that matters. A customer entering a freshly issued card for the first time cannot be affected by an ageing stored credential — which points away from a card-on-file problem and toward something in how the transactions are being submitted to us. We also ruled out a retry pattern, a Nubank-wide event, price mix and an outage.</p>

<h3>What we would like to ask</h3>

<p>Could your team check whether anything changed around <strong>29 September</strong>? Specifically:</p>

<ul>
<li>a change of gateway, acquirer or payment service provider, or a new routing rule;</li>
<li>a version upgrade or configuration change in the payment integration;</li>
<li>changes to the fields sent in the authorization message — token or PAN format, expiry date, CVV presence, or the stored-credential and MIT/CIT indicators;</li>
<li>a migration of stored credentials between systems or providers.</li>
</ul>

<p>Any one of these could produce exactly this signature.</p>

<h3>What we are doing on our side</h3>

<p>We are reviewing the authorization logs for your traffic before and after 29 September, and implementing per-merchant approval-rate alerting. This ran for three months and you noticed it before we did — that part is on us, and I would rather say so plainly.</p>

<p>Separately, two structural improvements worth discussing: network tokenization with automatic credential updating, which prevents stored cards from silently ageing out; and a retry strategy by decline reason. Today only 22% of Card Status declines are retried within seven days, and 10% recover — there is recoverable revenue there for both of us.</p>

<h3>Proposed next step</h3>

<p>A 45-minute call this week with your payments engineering team and ours, working through the checklist above together. Once we close the root cause, I would also like to propose a joint recovery campaign for the subscribers whose charges stopped succeeding during the quarter.</p>

<p>I will send an invitation for Thursday unless another day works better.</p>

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
