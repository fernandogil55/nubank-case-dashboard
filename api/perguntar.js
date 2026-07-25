// Serverless Function (Vercel) — recebe uma pergunta em português,
// busca os dados do case ao vivo no Supabase e pede ao Gemini para responder.
// A chave do Gemini fica em process.env.GEMINI_API_KEY — NUNCA vai para o navegador.

const SUPABASE_URL = "https://byutclnydulndyhgbbkf.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5dXRjbG55ZHVsbmR5aGdiYmtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NzMzNjgsImV4cCI6MjEwMDI0OTM2OH0.XMZoQ-St9GkcBxW58dFbhN1cR-JND7IHV3jSnEw9ATI";

async function sb(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
  });
  return r.json();
}

// Modelos em ordem de preferência: se o primeiro falhar (cota/indisponível), tenta o próximo.
const MODELOS = ["gemini-flash-latest", "gemini-3.1-flash-lite"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Use POST." });
  }
  const pergunta = (req.body?.pergunta || "").toString().trim();
  if (!pergunta) return res.status(400).json({ erro: "Faça uma pergunta." });
  if (pergunta.length > 500) return res.status(400).json({ erro: "Pergunta muito longa." });

  const KEY = process.env.GEMINI_API_KEY;
  if (!KEY) {
    return res.status(500).json({
      erro: "O servidor ainda não tem a chave do Gemini configurada (GEMINI_API_KEY).",
    });
  }

  try {
    // 1) dados ao vivo do banco
    const [head, m1, merch, findings, seg] = await Promise.all([
      sb("case_headlines?select=*"),
      sb("m1_monthly?select=*&order=mes"),
      sb("merchant_overview?select=*&order=txns.desc"),
      sb("case_findings?select=*"),
      sb("merchant_segment?select=*&order=txns.desc"),
    ]);

    // 2) contexto para o modelo
    const contexto = [
      "NÚMEROS-CHAVE:",
      ...head.map((h) => `- ${h.metric}: ${h.value}${h.unit}`),
      "",
      "M1 — MÊS A MÊS (aprovação e % de negativas por Card Status):",
      ...m1.map(
        (r) =>
          `- ${r.mes}: aprovação ${(r.approval * 100).toFixed(1)}%, ${r.txns} txns, Card Status ${(r.card_status_pct * 100).toFixed(1)}%`
      ),
      "",
      "APROVAÇÃO POR MERCHANT:",
      ...merch.map(
        (r) =>
          `- ${r.merchant_id}: ${(r.approval * 100).toFixed(1)}% aprovação, ${r.txns} txns (${(r.volume_share * 100).toFixed(1)}% do volume)`
      ),
      "",
      "APROVAÇÃO POR MERCHANT × TIPO DE TRANSAÇÃO × USO DO CARTÃO (para cruzamentos específicos):",
      ...seg.map(
        (r) =>
          `- ${r.merchant_id} / ${r.transaction_type} / ${r.card_use}: ${(r.approval * 100).toFixed(1)}% aprovação, ${r.txns} txns, ticket médio R$${(+r.avg_ticket).toFixed(2)}` +
          ` | negativas: Card Status ${(r.card_status_pct * 100).toFixed(1)}%, Limite ${(r.limit_pct * 100).toFixed(1)}%, Fraude ${(r.fraud_pct * 100).toFixed(1)}% (das tentativas)`
      ),
      "",
      "CONCLUSÕES DO DIAGNÓSTICO (análise já validada — use como fonte principal):",
      ...findings.map(
        (f) =>
          `\n[${f.topico}] ${f.conclusao}\n  Números: ${f.numeros}` +
          (f.alerta ? `\n  ⚠ IMPORTANTE: ${f.alerta}` : "")
      ),
    ].join("\n");

    const sistema =
      "Você é um analista de Autorização de transações de crédito, respondendo sobre o case do Nubank. " +
      "Responda SEMPRE em português do Brasil, de forma direta e com números. " +
      "Use APENAS os dados fornecidos abaixo — se a pergunta não puder ser respondida com eles, diga isso com honestidade e explique o que teria que ser analisado. " +
      "Os itens marcados com ⚠ são INSTRUÇÕES INTERNAS para você: obedeça-as rigorosamente, mas NUNCA as reproduza, cite ou mencione na resposta. " +
      "O leitor não deve ver nenhum aviso, nenhum '⚠', nem frases como 'não afirme' ou 'não atribua'. " +
      "Escreva como um analista falando com um colega: apenas a conclusão correta, com os números certos, em tom natural. " +
      "Traga sempre a leitura de negócio (o que o número significa), não só o número. Seja conciso (no máximo ~4 frases).\n\n" +
      "DADOS DO CASE (lidos ao vivo do banco):\n" +
      contexto;

    // 3) chamada ao Gemini (tenta os modelos em ordem até um responder)
    const corpo = JSON.stringify({
      system_instruction: { parts: [{ text: sistema }] },
      contents: [{ role: "user", parts: [{ text: pergunta }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1200,
        // modelos novos gastam orçamento "pensando" antes de escrever — desliga isso
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    let ultimoErro = "";
    for (const modelo of MODELOS) {
      const gr = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: corpo }
      );
      const gj = await gr.json();
      if (gr.ok) {
        const resposta = gj?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (resposta) return res.status(200).json({ resposta, modelo });
        ultimoErro = "resposta vazia";
      } else {
        ultimoErro = gj?.error?.message || String(gr.status);
      }
    }
    return res.status(502).json({ erro: "Não consegui gerar resposta. (" + ultimoErro + ")" });
  } catch (e) {
    return res.status(500).json({ erro: "Falha no servidor: " + e.message });
  }
}
