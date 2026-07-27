import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://byutclnydulndyhgbbkf.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5dXRjbG55ZHVsbmR5aGdiYmtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NzMzNjgsImV4cCI6MjEwMDI0OTM2OH0.XMZoQ-St9GkcBxW58dFbhN1cR-JND7IHV3jSnEw9ATI";

const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
const status = document.getElementById("status");
const fmt = (d) => new Date(d).toLocaleString("pt-BR");

function count(rows, key) {
  const m = {};
  for (const r of rows) {
    const k = r[key] || "(nenhuma)";
    m[k] = (m[k] || 0) + 1;
  }
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

function fillTable(id, pairs, label) {
  const tb = document.querySelector(`#${id} tbody`);
  if (!pairs.length) { tb.innerHTML = `<tr><td>Nada ainda.</td></tr>`; return; }
  tb.innerHTML = pairs
    .map(([k, n]) => `<tr><td><strong>${k}</strong></td><td style="text-align:right">${n}</td></tr>`)
    .join("");
}

async function main() {
  try {
    const { data, error } = await sb
      .from("site_hits").select("*").order("ts", { ascending: false }).limit(2000);
    if (error) throw error;

    const total = data.length;
    const days = new Set(data.map((r) => (r.ts || "").slice(0, 10))).size;
    const tagged = data.filter((r) => r.tag).length;
    const last = total ? fmt(data[0].ts) : "—";

    document.getElementById("kpis").innerHTML = [
      { val: total, lbl: "Visitas registradas" },
      { val: days, lbl: "Dias com visita" },
      { val: tagged, lbl: "Visitas com etiqueta" },
      { val: last, lbl: "Última visita", small: true },
    ].map((c) => `<div class="kpi"><div class="val" style="${c.small ? "font-size:15px" : ""}">${c.val}</div><div class="lbl">${c.lbl}</div></div>`).join("");

    fillTable("tblTags", count(data, "tag"));
    fillTable("tblPages", count(data, "path"));

    const rec = document.querySelector("#tblRecent tbody");
    rec.innerHTML = data.slice(0, 50).map((r) =>
      `<tr><td>${fmt(r.ts)}</td><td>${r.path || ""}</td><td>${r.tag ? "<strong>" + r.tag + "</strong>" : "—"}</td><td>${r.ref || "direto"}</td></tr>`
    ).join("");

    status.textContent = `✓ ${total} visitas lidas ao vivo · ${new Date().toLocaleString("pt-BR")}`;
  } catch (e) {
    status.textContent = "Erro ao ler visitas: " + e.message;
    console.error(e);
  }
}

main();
