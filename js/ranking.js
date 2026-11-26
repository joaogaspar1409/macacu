// Ranking: usa o Firebase (Firestore) se estiver configurado em js/config.js;
// caso contrário, guarda as partidas só neste navegador (localStorage).
const CFG = window.JOGO_CONFIG || {};
const CHAVE_LOCAL = "atlasmacacu_ranking_localidades";
const VER = "10.12.2";
let fb = null;

async function firebase() {
  if (!CFG.firebase) return null;
  if (fb) return fb;
  try {
    const app = await import(`https://www.gstatic.com/firebasejs/${VER}/firebase-app.js`);
    const fs = await import(`https://www.gstatic.com/firebasejs/${VER}/firebase-firestore.js`);
    const a = app.initializeApp(CFG.firebase);
    fb = { fs, db: fs.getFirestore(a) };
    return fb;
  } catch (e) {
    console.warn("Firebase indisponível, usando ranking local.", e);
    return null;
  }
}

export function online() { return !!CFG.firebase; }

function ordenar(lista) {
  return lista.sort((a, b) => (b.acertos - a.acertos) || (a.tempo - b.tempo));
}

function lerLocal() {
  try { return JSON.parse(localStorage.getItem(CHAVE_LOCAL) || "[]"); } catch { return []; }
}

export async function salvar(reg) {
  const f = await firebase();
  if (f) {
    const ref = await f.fs.addDoc(f.fs.collection(f.db, CFG.colecao || "ranking_localidades"), {
      nome: reg.nome, turma: reg.turma, acertos: reg.acertos, total: reg.total,
      tempo: reg.tempo, data: f.fs.serverTimestamp()
    });
    return { id: ref.id, online: true };
  }
  const lista = lerLocal();
  const id = "L" + Date.now();
  lista.push({ ...reg, id, data: Date.now() });
  try { localStorage.setItem(CHAVE_LOCAL, JSON.stringify(ordenar(lista).slice(0, 200))); } catch {}
  return { id, online: false };
}

export async function listar(limite = 15) {
  const f = await firebase();
  if (f) {
    const q = f.fs.query(
      f.fs.collection(f.db, CFG.colecao || "ranking_localidades"),
      f.fs.orderBy("acertos", "desc"),
      f.fs.limit(500)
    );
    const snap = await f.fs.getDocs(q);
    const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return ordenar(lista).slice(0, limite);
  }
  return ordenar(lerLocal()).slice(0, limite);
}
