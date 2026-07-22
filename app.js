import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Chart from "https://esm.sh/chart.js@4/auto";

// Chave "anon" é pública por design: só lê os dados agregados liberados pela policy (RLS).
const SUPABASE_URL = "https://byutclnydulndyhgbbkf.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5dXRjbG55ZHVsbmR5aGdiYmtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NzMzNjgsImV4cCI6MjEwMDI0OTM2OH0.XMZoQ-St9GkcBxW58dFbhN1cR-JND7IHV3jSnEw9ATI";

const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
const status = document.getElementById("status");
const fmtBR = (n) => n.toLocaleString("pt-BR");

async function main() {
  try {
    const [{ data: head }, { data: m1 }, { data: merch }] = await Promise.all([
      sb.from("case_headlines").select("*"),
      sb.from("m1_monthly").select("*").order("mes"),
      sb.from("merchant_overview").select("*").order("txns", { ascending: false }),
    ]);

    renderKpis(head);
    renderM1(m1);
    renderMerch(merch);
    status.textContent = `✓ ${head.length + m1.length + merch.length} registros lidos ao vivo do Supabase · ${new Date().toLocaleString("pt-BR")}`;
  } catch (e) {
    status.textContent = "Erro ao ler o banco: " + e.message;
    console.error(e);
  }
}

function kpi(head, metric) {
  return head.find((h) => h.metric === metric)?.value ?? 0;
}

function renderKpis(head) {
  const cards = [
    { val: kpi(head, "aprovacao_geral") + "%", lbl: "Aprovação geral" },
    { val: kpi(head, "aprovacao_m1") + "%", lbl: "Aprovação do M1 (ano)" },
    { val: "R$ " + fmtBR(kpi(head, "tpv_negado")), lbl: "TPV negado" },
    { val: kpi(head, "m1_share_volume") + "%", lbl: "M1 no volume total" },
  ];
  document.getElementById("kpis").innerHTML = cards
    .map((c) => `<div class="kpi"><div class="val">${c.val}</div><div class="lbl">${c.lbl}</div></div>`)
    .join("");
}

function renderM1(rows) {
  const labels = rows.map((r) => r.mes.slice(5)); // MM
  new Chart(document.getElementById("chartM1"), {
    data: {
      labels,
      datasets: [
        {
          type: "line", label: "Aprovação",
          data: rows.map((r) => +(r.approval * 100).toFixed(1)),
          borderColor: "#22c55e", backgroundColor: "#22c55e33",
          tension: 0.3, fill: true, yAxisID: "y", pointRadius: 3,
        },
        {
          type: "line", label: "Negativas por Card Status",
          data: rows.map((r) => +(r.card_status_pct * 100).toFixed(1)),
          borderColor: "#ef4444", borderDash: [5, 4],
          tension: 0.3, yAxisID: "y", pointRadius: 3,
        },
      ],
    },
    options: {
      plugins: { legend: { labels: { color: "#e8e8f0" } } },
      scales: {
        x: { ticks: { color: "#9a9ab0" }, grid: { color: "#2a2a38" } },
        y: { ticks: { color: "#9a9ab0", callback: (v) => v + "%" }, grid: { color: "#2a2a38" }, min: 0, max: 80 },
      },
    },
  });
}

function renderMerch(rows) {
  new Chart(document.getElementById("chartMerch"), {
    type: "bar",
    data: {
      labels: rows.map((r) => r.merchant_id),
      datasets: [{
        label: "Aprovação",
        data: rows.map((r) => +(r.approval * 100).toFixed(1)),
        backgroundColor: rows.map((r) => (r.merchant_id === "M1" ? "#ef4444" : "#820ad1")),
        borderRadius: 6,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#9a9ab0" }, grid: { display: false } },
        y: { ticks: { color: "#9a9ab0", callback: (v) => v + "%" }, grid: { color: "#2a2a38" }, min: 0, max: 100 },
      },
    },
  });
}

main();
