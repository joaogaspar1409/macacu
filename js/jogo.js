import { salvar, listar, online } from "./ranking.js";

const D = window.ATLAS_DADOS;
const DICAS = window.ATLAS_DICAS;
const CFG = window.JOGO_CONFIG || {};
const N = Math.min(CFG.rodadas || 10, D.localidades.length);
const NS = "http://www.w3.org/2000/svg";
const $ = id => document.getElementById(id);

/* ---------- utilidades ---------- */
function el(tag, attrs = {}, pai) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (pai) pai.appendChild(e);
  return e;
}
function fmt(seg) {
  const m = Math.floor(seg / 60), s = Math.floor(seg % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
function fmtFino(seg) {
  const m = Math.floor(seg / 60), s = (seg % 60).toFixed(1).padStart(4, "0");
  return m ? `${m}min ${s}s` : `${(seg % 60).toFixed(1)}s`;
}
function embaralhar(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/* ---------- mapa ---------- */
const svg = $("mapa");
const M = 40; // margem em volta do município
const base = { x: -M, y: -M, w: D.W + 2 * M, h: D.H + 2 * M };
let vb = { ...base };
const polys = new Map();
let gRotulos;

function desenharMapa() {
  svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  const gViz = el("g", {}, svg);
  D.vizinhos.forEach(v => el("path", { d: v.d, class: "vizinho" }, gViz));
  const gLabViz = el("g", {}, svg);
  D.vizinhos.forEach(v => {
    if (!v.lab) return;
    const t = el("text", { x: v.lab[0], y: v.lab[1], class: "rot-vizinho", "text-anchor": "middle" }, gLabViz);
    t.textContent = v.nome;
  });
  const gLoc = el("g", {}, svg);
  D.localidades.forEach(l => {
    const p = el("path", { d: l.d, class: "loc", "data-id": l.id }, gLoc);
    polys.set(l.id, p);
  });
  el("path", { d: D.municipio, class: "limite" }, svg);
  // grade de coordenadas (como nos mapas do Atlas)
  const gGrade = el("g", { class: "grade" }, svg);
  D.ticks.x.forEach(([x, t]) => {
    if (x < 20) return;
    el("line", { x1: x, y1: -M, x2: x, y2: -M + 8, stroke: "#1d1d1b" }, gGrade);
    const tx = el("text", { x, y: -M + 20, "text-anchor": "middle" }, gGrade); tx.textContent = t;
  });
  D.ticks.y.forEach(([y, t]) => {
    el("line", { x1: -M, y1: y, x2: -M + 8, y2: y, stroke: "#1d1d1b" }, gGrade);
    const ty = el("text", { x: -M + 11, y: y + 3 }, gGrade); ty.textContent = t;
  });
  gRotulos = el("g", {}, svg);
  desenharInset();
  atualizarEscala();
}

function desenharInset() {
  const I = D.inset;
  const s = el("svg", { viewBox: `-4 -4 ${I.w + 8} ${I.h + 8}`, role: "img", "aria-label": "Localização de Cachoeiras de Macacu no estado do Rio de Janeiro" });
  el("path", { d: I.estado, class: "estado" }, s);
  el("path", { d: I.cm, class: "cm" }, s);
  const t1 = el("text", { x: 8, y: 14, class: "rot" }, s); t1.textContent = "Estado do Rio de Janeiro";
  const t2 = el("text", { x: I.w * 0.55, y: I.h - 4, class: "rot" }, s); t2.textContent = "Oceano Atlântico";
  $("inset").appendChild(s);
}

function rotular(id) {
  const l = D.localidades.find(x => x.id === id);
  const t = el("text", { x: l.cx, y: l.cy, class: "rotulo" }, gRotulos);
  t.textContent = l.nome;
  ajustarRotulos();
}
function ajustarRotulos() {
  const f = Math.max(0.45, Math.min(1.6, vb.w / base.w));
  gRotulos.querySelectorAll("text").forEach(t => t.style.fontSize = (13 * f) + "px");
}

/* zoom e arrasto */
function aplicarVB() {
  svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  atualizarEscala(); ajustarRotulos();
}
function limitar() {
  vb.w = Math.min(base.w, Math.max(base.w / 8, vb.w));
  vb.h = vb.w * base.h / base.w;
  vb.x = Math.min(base.x + base.w - vb.w, Math.max(base.x, vb.x));
  vb.y = Math.min(base.y + base.h - vb.h, Math.max(base.y, vb.y));
}
function pontoSVG(cx, cy) {
  const pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}
function zoom(fator, cx, cy) {
  const r = svg.getBoundingClientRect();
  const p = pontoSVG(cx ?? r.left + r.width / 2, cy ?? r.top + r.height / 2);
  const nw = vb.w / fator;
  const nwC = Math.min(base.w, Math.max(base.w / 8, nw));
  const k = nwC / vb.w;
  vb.x = p.x - (p.x - vb.x) * k; vb.y = p.y - (p.y - vb.y) * k;
  vb.w = nwC; limitar(); aplicarVB();
}
$("z-mais").onclick = () => zoom(1.5);
$("z-menos").onclick = () => zoom(1 / 1.5);
$("z-reset").onclick = () => { vb = { ...base }; aplicarVB(); };
svg.addEventListener("wheel", e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.25 : 0.8, e.clientX, e.clientY); }, { passive: false });

const ponteiros = new Map();
let arrasto = null, moveu = false, pinca = null;
svg.addEventListener("pointerdown", e => {
  ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ponteiros.size === 1) { arrasto = { x: e.clientX, y: e.clientY, vb: { ...vb } }; moveu = false; }
  if (ponteiros.size === 2) {
    const [a, b] = [...ponteiros.values()];
    pinca = { d: Math.hypot(a.x - b.x, a.y - b.y) }; arrasto = null; moveu = true;
  }
});
svg.addEventListener("pointermove", e => {
  if (!ponteiros.has(e.pointerId)) return;
  ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinca && ponteiros.size === 2) {
    const [a, b] = [...ponteiros.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    zoom(d / pinca.d, (a.x + b.x) / 2, (a.y + b.y) / 2); pinca.d = d; return;
  }
  if (!arrasto) return;
  const dx = e.clientX - arrasto.x, dy = e.clientY - arrasto.y;
  if (Math.hypot(dx, dy) > 6) { moveu = true; svg.classList.add("arrastando"); }
  if (!moveu) return;
  const r = svg.getBoundingClientRect();
  const esc = Math.max(vb.w / r.width, vb.h / r.height);
  vb.x = arrasto.vb.x - dx * esc; vb.y = arrasto.vb.y - dy * esc;
  limitar(); aplicarVB();
});
function soltar(e) {
  ponteiros.delete(e.pointerId);
  if (ponteiros.size < 2) pinca = null;
  if (ponteiros.size === 0) { arrasto = null; svg.classList.remove("arrastando"); }
}
svg.addEventListener("pointerup", soltar);
svg.addEventListener("pointercancel", soltar);
svg.addEventListener("click", e => {
  if (moveu) { moveu = false; return; }
  const p = e.target.closest(".loc");
  if (p) responder(Number(p.dataset.id));
});

function atualizarEscala() {
  const r = svg.getBoundingClientRect();
  if (!r.width) return;
  const pxPorUnid = Math.min(r.width / vb.w, r.height / vb.h);
  const pxPorKm = D.km * pxPorUnid;
  const opcoes = [0.5, 1, 2, 2.5, 5, 10];
  let km = opcoes[0];
  for (const o of opcoes) if (o * pxPorKm <= 130) km = o;
  const larg = km * pxPorKm;
  $("escala").innerHTML = `<div class="barra" style="width:${larg.toFixed(0)}px"><span></span><span></span><span></span><span></span></div>
    <div class="nums" style="width:${larg.toFixed(0)}px"><span>0</span><span>${String(km / 2).replace(".", ",")}</span><span>${String(km).replace(".", ",")} km</span></div>`;
}
window.addEventListener("resize", atualizarEscala);

/* ---------- jogo ---------- */
let fila = [], rodada = 0, acertos = 0, inicio = 0, relogio = null, bloqueado = false, historico = [], jogador = {};

function mostrar(tela) {
  ["tela-inicio", "tela-jogo", "tela-fim"].forEach(t => $(t).classList.toggle("oculto", t !== tela));
  window.scrollTo(0, 0);
  if (tela === "tela-jogo") requestAnimationFrame(atualizarEscala);
}

function novoJogo() {
  const nome = $("nome").value.trim();
  if (!nome) { $("nome").focus(); $("nome").placeholder = "Digite seu nome para jogar"; return; }
  jogador = { nome: nome.slice(0, 30), turma: $("turma").value.trim().slice(0, 30) };
  try { localStorage.setItem("atlasmacacu_jogador", JSON.stringify(jogador)); } catch {}
  fila = embaralhar(D.localidades.map(l => l.id)).slice(0, N);
  rodada = 0; acertos = 0; historico = [];
  polys.forEach(p => p.setAttribute("class", "loc"));
  gRotulos.innerHTML = "";
  vb = { ...base };
  mostrar("tela-jogo"); aplicarVB();
  inicio = performance.now();
  clearInterval(relogio);
  relogio = setInterval(() => $("p-tempo").textContent = fmt((performance.now() - inicio) / 1000), 250);
  proxima();
}

function proxima() {
  bloqueado = false;
  const id = fila[rodada];
  const l = D.localidades.find(x => x.id === id);
  $("p-rodada").textContent = `${rodada + 1}/${N}`;
  $("p-acertos").textContent = acertos;
  $("q-nome").textContent = l.nome;
  $("q-dica").textContent = DICAS[l.nome] || "";
  $("q-retorno").textContent = ""; $("q-retorno").className = "retorno";
}

function responder(idClicado) {
  if (bloqueado || rodada >= N) return;
  bloqueado = true;
  const alvo = fila[rodada];
  const certo = idClicado === alvo;
  const pAlvo = polys.get(alvo), pClic = polys.get(idClicado);
  const nomeAlvo = D.localidades.find(x => x.id === alvo).nome;
  if (certo) {
    acertos++;
    pAlvo.setAttribute("class", "loc acerto");
    $("q-retorno").textContent = "Acertou!"; $("q-retorno").className = "retorno ok";
  } else {
    const nomeClic = D.localidades.find(x => x.id === idClicado).nome;
    pClic.setAttribute("class", "loc erro");
    pAlvo.setAttribute("class", "loc certa");
    $("q-retorno").textContent = `Errou: você clicou em ${nomeClic}.`; $("q-retorno").className = "retorno no";
    rotular(idClicado);
  }
  rotular(alvo);
  historico.push({ nome: nomeAlvo, certo });
  $("p-acertos").textContent = acertos;
  const espera = certo ? 1300 : 2400;
  setTimeout(() => {
    pAlvo.setAttribute("class", "loc " + (certo ? "feita" : "feita-erro"));
    if (!certo && pClic.getAttribute("class") === "loc erro") pClic.setAttribute("class", "loc");
    rodada++;
    if (rodada >= N) terminar(); else proxima();
  }, espera);
}

async function terminar() {
  clearInterval(relogio);
  const tempo = Math.round((performance.now() - inicio) / 100) / 10;
  $("r-acertos").textContent = acertos;
  $("r-total").textContent = N;
  $("r-tempo").textContent = fmtFino(tempo);
  const pct = acertos / N;
  $("r-msg").textContent = pct === 1 ? "Perfeito! Você conhece muito bem Cachoeiras de Macacu." :
    pct >= 0.7 ? "Muito bom! Falta pouco para conhecer todas as localidades." :
    pct >= 0.4 ? "Bom começo! Jogue de novo e aprenda mais sobre o município." :
    "Que tal explorar o mapa de localidades do Atlas e tentar de novo?";
  $("r-lista").innerHTML = historico.map(h => `<li class="${h.certo ? "ok" : "no"}">${esc(h.nome)}</li>`).join("");
  mostrar("tela-fim");
  $("r-salvo").textContent = "Salvando no ranking…";
  let meuId = null;
  try {
    const r = await salvar({ nome: jogador.nome, turma: jogador.turma, acertos, total: N, tempo });
    meuId = r.id;
    $("r-salvo").textContent = r.online ? "Resultado salvo no ranking." : "Resultado salvo no ranking deste computador.";
  } catch (e) {
    console.error(e);
    $("r-salvo").textContent = "Não foi possível salvar no ranking agora.";
  }
  mostrarRanking("ranking-fim", meuId);
}

async function mostrarRanking(alvo, meuId) {
  const box = $(alvo);
  try {
    const lista = await listar(15);
    if (!lista.length) { box.innerHTML = '<p class="vazio">Ninguém jogou ainda. Seja o primeiro!</p>'; return; }
    box.innerHTML = `<table class="ranking"><thead><tr><th>#</th><th>Jogador</th><th class="r">Acertos</th><th class="r">Tempo</th></tr></thead><tbody>` +
      lista.map((r, i) => `<tr class="${r.id === meuId ? "voce" : ""}"><td class="n">${i + 1}º</td><td>${esc(r.nome)}${r.turma ? `<span class="turma">${esc(r.turma)}</span>` : ""}</td><td class="r">${r.acertos}/${r.total || N}</td><td class="r">${fmtFino(r.tempo)}</td></tr>`).join("") +
      `</tbody></table>` + (online() ? "" : '<p class="aviso">Ranking deste computador. O ranking online aparece quando o Firebase estiver configurado.</p>');
  } catch (e) {
    console.error(e);
    box.innerHTML = '<p class="vazio">Não foi possível carregar o ranking.</p>';
  }
}

/* ---------- início ---------- */
$("n-rodadas").textContent = N;
try {
  const j = JSON.parse(localStorage.getItem("atlasmacacu_jogador") || "null");
  if (j) { $("nome").value = j.nome || ""; $("turma").value = j.turma || ""; }
} catch {}
desenharMapa();
$("btn-jogar").onclick = novoJogo;
$("nome").addEventListener("keydown", e => { if (e.key === "Enter") novoJogo(); });
$("btn-denovo").onclick = novoJogo;
$("btn-inicio").onclick = () => { mostrar("tela-inicio"); mostrarRanking("ranking-inicio"); };
mostrarRanking("ranking-inicio");
