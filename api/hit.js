// Registra uma visita ao site na tabela site_hits do Supabase.
// Sem cookies, sem IP, sem user-agent — só página, tag (?v=) e domínio de origem.

const SUPABASE_URL = "https://byutclnydulndyhgbbkf.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5dXRjbG55ZHVsbmR5aGdiYmtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NzMzNjgsImV4cCI6MjEwMDI0OTM2OH0.XMZoQ-St9GkcBxW58dFbhN1cR-JND7IHV3jSnEw9ATI";

export default async function handler(req, res) {
  try {
    const q = req.query || {};
    const path = (q.path || "").toString().slice(0, 200);
    const tag = (q.tag || "").toString().slice(0, 80);
    const ref = (q.ref || "").toString().slice(0, 120);
    await fetch(`${SUPABASE_URL}/rest/v1/site_hits`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ path, tag: tag || null, ref: ref || null }),
    });
  } catch (e) {
    /* nunca quebra a página do visitante */
  }
  res.setHeader("Cache-Control", "no-store");
  res.status(204).end();
}
