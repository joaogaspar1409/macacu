// ===== CONFIGURAÇÃO DO JOGO =====
// 1) Número de localidades por partida
window.JOGO_CONFIG = {
  rodadas: 10,
  // 2) Ranking online (Firebase). Cole aqui o firebaseConfig do seu projeto
  //    (Console do Firebase > Configurações do projeto > Seus apps > Web).
  //    Enquanto ficar null, o ranking é salvo só neste navegador.
  firebase: null,
  // Nome da coleção do Firestore onde as partidas ficam guardadas
  colecao: "ranking_localidades"
};
