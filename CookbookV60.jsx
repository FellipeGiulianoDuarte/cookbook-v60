import React, { useState, useMemo, useEffect } from "react";
import { Coffee, Droplet, Thermometer, Settings2, Timer, AlertCircle, ChevronDown, Beaker } from "lucide-react";

const ROASTS = {
  clara:       { label: "Clara",        clicks: 13, temp: 96 },
  mediaClara:  { label: "Média-clara",  clicks: 14, temp: 95 },
  media:       { label: "Média",        clicks: 14, temp: 94 },
  mediaEscura: { label: "Média-escura", clicks: 16, temp: 90 },
  escura:      { label: "Escura",       clicks: 18, temp: 88 },
};

const PROCESSES = {
  washed:     { label: "Lavado",              dClick: 0, dTemp: 0,  ratio: 16.0, nota: "Limpo e brilhante. Mostra a origem com transparência. Acidez nítida." },
  natural:    { label: "Natural",             dClick: 1, dTemp: -2, ratio: 16.6, nota: "Cereja seca inteira. Corpo cheio, doçura intensa, notas frutadas selvagens." },
  honey:      { label: "Honey",               dClick: 0, dTemp: -1, ratio: 16.0, nota: "Meio-termo: parte da mucilagem fica no grão. Doce, corpo médio-cheio." },
  anaerobio:  { label: "Anaeróbico",          dClick: 1, dTemp: -3, ratio: 17.0, nota: "Fermentado em tanque selado sem oxigênio. Winey, intenso, tropical." },
  carbonica:  { label: "Maceração carbônica", dClick: 1, dTemp: -3, ratio: 17.0, nota: "Cereja inteira fermentada em CO₂ (técnica do vinho). Muito aromático." },
  cofermento: { label: "Co-fermentado",       dClick: 2, dTemp: -3, ratio: 17.0, nota: "Fermentado com frutas/leveduras adicionadas. Sabor extremo e divisivo." },
};

const ORIGINS = [
  ["Etiópia (washed)", "Floral, cítrico, chá, corpo leve, acidez alta"],
  ["Etiópia (natural)", "Mirtilo, morango, vinhoso, doçura tropical"],
  ["Quênia AA", "Groselha negra, tomate, acidez fosfórica intensa"],
  ["Colômbia", "Caramelo, chocolate ao leite, frutas vermelhas"],
  ["Brasil", "Chocolate, nozes, amendoim, baixa acidez, cremoso"],
  ["Costa Rica (honey)", "Mel, frutas amarelas, doçura limpa"],
  ["Guatemala", "Cacau, especiarias, frutas vermelhas, elegante"],
  ["Panamá Geisha", "Floral exuberante, bergamota, jasmim, mel"],
  ["Indonésia", "Terroso, especiarias, corpo cheio, defumado"],
];

const TROUBLE = [
  { s: "Drena rápido demais (<2:00) + azedo", d: "Moagem grossa demais", f: "2–3 cliques mais fino" },
  { s: "Drena lento demais (>4:00) + amargo", d: "Moagem fina demais / muitos finos", f: "2–3 cliques mais grosso, menos agitação" },
  { s: "Azedo / raso, mas tempo OK", d: "Sub-extração (temp baixa ou pouca agitação)", f: "Subir temp 2 °C, mais swirl" },
  { s: "Amargo / seco, mas tempo OK", d: "Super-extração (temp alta ou agitação excessiva)", f: "Baixar temp 2 °C, menos agitação" },
  { s: "Bloom não infla", d: "Café velho, já desgaseificado", f: "Use café mais fresco; bloom 2×" },
  { s: "Bloom explode / transborda", d: "Café muito fresco", f: "Espere 3–5 dias; use bloom 3×" },
  { s: "Cama final com paredes altas", d: "Channeling (canais)", f: "Despejo mais central, swirl ao final" },
  { s: "Entope (stalling total)", d: "Excesso de finos", f: "Moagem mais grossa, troque o filtro" },
];

const SECTIONS = [["receita", "Receita"], ["teoria", "Teoria"], ["moagem", "Moagem"], ["origens", "Origens"], ["problemas", "Problemas"]];
const GRIND = [["Espresso", "5–10", "Fina"], ["Moka pot", "10–13", "Média-fina"], ["V60 (recomendado)", "11–18", "Média a média-fina"], ["Chemex", "18–24", "Média-grossa"], ["French Press", "19–25", "Grossa"]];
const THEORY = [
  ["Sub-extração", "<18%", "Azedo, salgado, raso, aguado", "Moa mais fino, água mais quente, mais contato", "#9d2b2b"],
  ["Golden Cup", "18–22%", "Doce, brilhante, final limpo e longo", "Mantenha. Anote tudo e repita.", "#2d6a4f"],
  ["Super-extração", ">22%", "Amargo, adstringente, seco", "Moa mais grosso, água mais fria, menos contato", "#9d2b2b"],
];

function Stat({ icon: Icon, label, value, unit }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-[#e3d3bd] bg-[#fbf4e8] p-4">
      <div className="flex items-center gap-2 text-[#9c7a52]">
        <Icon size={15} strokeWidth={2.2} />
        <span className="text-[11px] uppercase tracking-[0.14em]">{label}</span>
      </div>
      <div className="font-display text-3xl leading-none text-[#3a2414]">
        {value}{unit && <span className="ml-1 text-base text-[#9c7a52]">{unit}</span>}
      </div>
    </div>
  );
}

function Section({ id, kicker, title, children }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-[#e6d6bf] py-10">
      <p className="mb-1 font-display text-xs uppercase tracking-[0.3em] text-[#b08a5a]">{kicker}</p>
      <h2 className="mb-5 font-display text-3xl text-[#3a2414] md:text-4xl">{title}</h2>
      {children}
    </section>
  );
}

export default function App() {
  const [dose, setDose] = useState(15);
  const [roast, setRoast] = useState("media");
  const [process, setProcess] = useState("washed");
  const [openT, setOpenT] = useState(null);
  const [active, setActive] = useState("receita");
  const r = ROASTS[roast];
  const p = PROCESSES[process];

  const rec = useMemo(() => {
    const clicks = Math.max(6, r.clicks + p.dClick);
    const temp = r.temp + p.dTemp;
    const water = Math.round(dose * p.ratio);
    return { clicks, temp, ratio: p.ratio, water, bloom: dose * 2, firstPour: Math.round(water * 0.6) };
  }, [dose, r, p]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const go = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };

  const pct = ((dose - 10) / 20) * 100;

  const pill = (on) =>
    `rounded-full border px-4 py-2 text-sm transition ${
      on
        ? "border-[#5b3a1c] bg-[#5b3a1c] font-semibold text-[#f6ecdc] shadow-[0_3px_12px_rgba(91,58,28,0.28)] -translate-y-px"
        : "border-[#e3d3bd] bg-transparent text-[#7a5c3a] hover:border-[#8b4513] hover:text-[#8b4513]"
    }`;

  return (
    <div className="min-h-screen bg-[#f7efe2] text-[#3a2414]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Spline+Sans:wght@400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; }
        body, .font-body { font-family: 'Spline Sans', system-ui, sans-serif; }
        .slider { -webkit-appearance:none; appearance:none; width:100%; height:8px; border-radius:999px; outline:none; cursor:pointer; }
        .slider::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:26px; height:26px; border-radius:50%; background:#5b3a1c; border:4px solid #f6ecdc; box-shadow:0 2px 8px rgba(91,58,28,.4); cursor:pointer; }
        .slider::-moz-range-thumb { width:26px; height:26px; border-radius:50%; background:#5b3a1c; border:4px solid #f6ecdc; box-shadow:0 2px 8px rgba(91,58,28,.4); cursor:pointer; }
      `}</style>

      <div className="font-body mx-auto max-w-3xl px-5 pb-20">
        <nav className="sticky top-0 z-20 -mx-5 mb-2 flex gap-2 overflow-x-auto border-b border-[#e6d6bf] bg-[#f7efe2]/90 px-5 py-3 backdrop-blur">
          {SECTIONS.map(([id, label]) => (
            <button key={id} onClick={() => go(id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition ${
                active === id ? "bg-[#5b3a1c] text-[#f6ecdc] shadow-[0_2px_10px_rgba(91,58,28,0.3)]" : "bg-[#efe2cf] text-[#6b4f30] hover:bg-[#e5d4ba]"
              }`}>
              {label}
            </button>
          ))}
        </nav>

        <header className="py-12 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5b3a1c] text-[#f6ecdc] shadow-lg">
              <Coffee size={30} strokeWidth={1.8} />
            </div>
          </div>
          <h1 className="font-display text-5xl font-black leading-[0.95] text-[#3a2414] md:text-6xl">
            Cookbook<br /><span className="italic text-[#8b4513]">V60</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[#7a5c3a]">
            Um método base sólido e suas variações por torra, processo e grão — calibrado para o Timemore C3S Pro.
          </p>
        </header>

        <Section id="receita" kicker="Método base + variações" title="Calculadora">
          <div className="rounded-3xl border border-[#e3d3bd] bg-[#fffdf9] p-6 shadow-[0_4px_30px_rgba(91,58,28,0.07)]">
            <div className="mb-5">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-[13px] font-semibold uppercase tracking-wide text-[#9c7a52]">Dose de café</span>
                <span className="font-display text-2xl text-[#3a2414]">{dose} g</span>
              </div>
              <input type="range" min={10} max={30} step={1} value={dose}
                onChange={(e) => setDose(+e.target.value)} className="slider"
                style={{ background: `linear-gradient(to right, #8b4513 ${pct}%, #e7d8c1 ${pct}%)` }} />
            </div>

            <div className="mb-5">
              <p className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-[#9c7a52]">Torra</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ROASTS).map(([k, v]) => (
                  <button key={k} onClick={() => setRoast(k)} className={pill(roast === k)}>{v.label}</button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-[#9c7a52]">Processo do grão</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PROCESSES).map(([k, v]) => (
                  <button key={k} onClick={() => setProcess(k)} className={pill(process === k)}>{v.label}</button>
                ))}
              </div>
              <p className="mt-2.5 rounded-r-lg border-l-[3px] border-[#8b4513] bg-[#f6ecda] px-3 py-2 text-[13px] leading-relaxed text-[#7a5c3a]">{p.nota}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat icon={Droplet} label="Água" value={rec.water} unit="g" />
              <Stat icon={Settings2} label="Moagem" value={rec.clicks} unit="cliques" />
              <Stat icon={Thermometer} label="Temp." value={rec.temp} unit="°C" />
              <Stat icon={Beaker} label="Proporção" value={`1:${rec.ratio}`} unit="" />
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-[#e3d3bd] bg-[#fffdf9] p-6">
            <div className="mb-4 flex items-center gap-2 text-[#8b4513]">
              <Timer size={18} /><span className="font-display text-lg">Sequência de despejos</span>
            </div>
            <ol className="space-y-3">
              {[
                ["0:00", `Bloom: despeje ${rec.bloom} g de água, swirl gentil`],
                ["0:45", `Despejo 1: complete até ${rec.firstPour} g (60%) em espiral`],
                ["1:15", `Despejo 2: complete até ${rec.water} g`],
                ["1:50", "Swirl final para nivelar a cama"],
                ["~3:00", "Drawdown completo — sirva"],
              ].map(([t, txt], i) => (
                <li key={i} className="flex gap-4">
                  <span className="w-12 shrink-0 font-display text-sm font-semibold text-[#b08a5a]">{t}</span>
                  <span className="text-[15px] text-[#5a432d]">{txt}</span>
                </li>
              ))}
            </ol>
          </div>
        </Section>

        <Section id="teoria" kicker="Fundamentos" title="Extração em uma página">
          <div className="grid gap-3 md:grid-cols-3">
            {THEORY.map(([t, range, sinal, fix, c]) => (
              <div key={t} className="rounded-2xl border border-[#e3d3bd] bg-[#fffdf9] p-5">
                <div className="font-display text-lg" style={{ color: c }}>{t}</div>
                <div className="mb-2 text-sm font-semibold text-[#9c7a52]">{range}</div>
                <p className="mb-2 text-sm text-[#5a432d]">{sinal}</p>
                <p className="text-xs italic text-[#9c7a52]">{fix}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[15px] leading-relaxed text-[#5a432d]">
            O padrão SCA "Golden Cup": força (TDS) de 1,15–1,35% a partir de uma extração de 18–22%, água a 93 °C ±3 °C.
            As maiores alavancas, em ordem: <strong>moagem → proporção → temperatura → agitação → tempo</strong>.
          </p>
        </Section>

        <Section id="moagem" kicker="Timemore C3S Pro" title="Moagem em cliques">
          <div className="overflow-hidden rounded-2xl border border-[#e3d3bd]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#5b3a1c] text-[#f6ecdc]">
                <tr><th className="p-3">Método</th><th className="p-3">Cliques</th><th className="p-3">Granulometria</th></tr>
              </thead>
              <tbody className="bg-[#fffdf9]">
                {GRIND.map(([m, c, g], i) => (
                  <tr key={m} className={i % 2 ? "bg-[#faf3e7]" : ""}>
                    <td className={`p-3 ${m.includes("V60") ? "font-semibold text-[#8b4513]" : "text-[#5a432d]"}`}>{m}</td>
                    <td className="p-3 text-[#5a432d]">{c}</td>
                    <td className="p-3 text-[#9c7a52]">{g}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-[#5a432d]">
            83 µm por clique · 12 cliques por volta · mós S2C660 de 38 mm em aço inox.
            Ponto de partida universal: <strong>14 cliques</strong>. Mais clara/densa → mais fino; mais escura → mais grossa.
          </p>
        </Section>

        <Section id="origens" kicker="Sensorial" title="Perfis por origem">
          <div className="grid gap-2.5 md:grid-cols-2">
            {ORIGINS.map(([o, n]) => (
              <div key={o} className="rounded-xl border border-[#e3d3bd] bg-[#fffdf9] p-4">
                <div className="font-display text-base text-[#3a2414]">{o}</div>
                <p className="mt-0.5 text-sm text-[#7a5c3a]">{n}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="problemas" kicker="Diagnóstico" title="Resolvendo problemas">
          <div className="space-y-2">
            {TROUBLE.map((t, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-[#e3d3bd] bg-[#fffdf9]">
                <button onClick={() => setOpenT(openT === i ? null : i)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left">
                  <span className="flex items-center gap-2.5 text-[15px] text-[#3a2414]">
                    <AlertCircle size={16} className="shrink-0 text-[#b08a5a]" />{t.s}
                  </span>
                  <ChevronDown size={18} className={`shrink-0 text-[#b08a5a] transition-transform ${openT === i ? "rotate-180" : ""}`} />
                </button>
                {openT === i && (
                  <div className="border-t border-[#efe2cf] bg-[#faf3e7] px-4 py-3 text-sm">
                    <p className="text-[#7a5c3a]"><strong className="text-[#5a432d]">Causa:</strong> {t.d}</p>
                    <p className="mt-1 text-[#7a5c3a]"><strong className="text-[#5a432d]">Solução:</strong> {t.f}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        <footer className="mt-10 border-t border-[#e6d6bf] pt-8 text-center text-xs text-[#9c7a52]">
          ☕ Cookbook V60 · 2026 · Calibrado para Timemore C3S Pro<br />
          <span className="italic">Comece pelo método base. Prove com atenção. Ajuste uma variável por vez.</span>
        </footer>
      </div>
    </div>
  );
}
