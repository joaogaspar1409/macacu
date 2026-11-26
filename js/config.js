// ===== CONFIGURAÇÃO DO JOGO =====
// 1) Número de localidades por partida
window.JOGO_CONFIG = {
  rodadas: 10,
  // 2) Ranking online (Firebase – projeto "macacu", só deste jogo)
  firebase: {
    apiKey: "AIzaSyDIlZtEI46LhqPNlBNM0dL07xjYkJdoiIo",
    authDomain: "macacu-3a46d.firebaseapp.com",
    projectId: "macacu-3a46d",
    storageBucket: "macacu-3a46d.firebasestorage.app",
    messagingSenderId: "749456548858",
    appId: "1:749456548858:web:199ed8fa3f50f9422afa43"
  },
  // Nome da coleção do Firestore onde as partidas ficam guardadas
  colecao: "ranking_localidades"
};
