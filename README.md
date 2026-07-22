# Case Nubank — Dashboard de Autorização (M1)

Dashboard do diagnóstico de autorização de cartão do case (Product & Operations).
Lê dados agregados **ao vivo** de um banco Postgres no Supabase e renderiza os gráficos no navegador.

**Stack:** HTML/CSS/JS estático · [Supabase](https://supabase.com) (Postgres) · [Chart.js](https://www.chartjs.org) · deploy na [Vercel](https://vercel.com).

## Como funciona
- `index.html` — estrutura da página
- `style.css` — visual
- `app.js` — conecta no Supabase com a chave pública (anon) e desenha os gráficos

Os dados expostos são **apenas agregados** (sem nenhum dado pessoal), protegidos por Row Level Security que só permite leitura das tabelas de resumo.

## História em uma frase
Um merchant (M1), uma causa (negativas por *Card Status* = credenciais invalidadas em massa), uma data (semana de 29/set/2025).
