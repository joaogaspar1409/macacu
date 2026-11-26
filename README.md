# Onde fica? – Desafio das Localidades (Atlas Macacu)

Jogo em que o jogador recebe o nome de uma das 61 localidades de Cachoeiras de Macacu e uma dica, e precisa clicar nela no mapa. Tem cronômetro e ranking (acertos e tempo).

## Arquivos
- `index.html`: a página do jogo.
- `css/style.css`: o visual, inspirado no Atlas Macacu.
- `js/mapa.js`: o mapa (polígonos das 61 localidades, limite municipal, municípios vizinhos e mapa de localização do RJ). Gerado a partir do shapefile de localidades do CIGEO.
- `js/dicas.js`: uma dica por localidade. **Para mudar uma dica, edite só este arquivo.**
- `js/config.js`: número de rodadas e configuração do ranking online.
- `js/jogo.js` e `js/ranking.js`: o funcionamento do jogo.
- `firestore.rules`: regras de segurança do ranking no Firebase.

## Publicar no GitHub Pages
1. Crie um repositório (por exemplo, `jogo-localidades`) e envie todos os arquivos desta pasta, mantendo as subpastas `css` e `js`.
2. No repositório: **Settings → Pages → Branch: main / (root) → Save**.
3. Em alguns minutos, o jogo estará em `https://SEU-USUARIO.github.io/jogo-localidades/`.
4. No site atlasmacacu.com.br, aponte o botão para esse endereço.

Observação: o jogo não abre com dois cliques no `index.html` no computador. Ele precisa estar num servidor, como o GitHub Pages.

## Ranking online (Firebase)
Sem configurar nada, o ranking funciona só no navegador de quem joga. Para ter um ranking único para todos:
1. No Console do Firebase, use o projeto que você já tem (ou crie um novo) e ative o **Firestore Database**.
2. Em **Configurações do projeto → Seus apps → Web**, copie o objeto `firebaseConfig`.
3. Cole no `js/config.js`, no lugar de `firebase: null`, assim:
   ```js
   firebase: { apiKey: "...", authDomain: "...", projectId: "...", storageBucket: "...", messagingSenderId: "...", appId: "..." },
   ```
4. Em **Firestore → Regras**, cole o conteúdo de `firestore.rules` e publique.

As partidas ficam na coleção `ranking_localidades`. Para apagar um nome impróprio, apague o documento pelo próprio Console do Firebase.

## Ajustes rápidos
- Número de rodadas: `rodadas: 10` em `js/config.js`.
- Cores: no início de `css/style.css` (`--azul` é a cor da seção História do Atlas).

## Fontes
Localidades: CIGEO/SEPLAGH – Prefeitura de Cachoeiras de Macacu (Lei nº 2.428/2019). Limites municipais: IBGE, 2023. Conteúdo das dicas: Atlas Macacu (2022) e livro didático municipal.
