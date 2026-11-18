# Terreiro de Aruanda: O Jogo de Cartas

Jogo de cartas digital (React 18 + PixiJS v8 + Vite) com mão em leque e
arrastar e soltar.

## Como jogar

- Arraste uma carta da mão até a **gira** (a área central) para chamá-la.
- Cada carta custa **Axé** (número no círculo escuro). Ela causa **Ataque** (dano na demanda), dá
  **Defesa** (proteção só neste giro) e pode ter um **Passe**:
  - **Cura**: restaura Harmonia.
  - **Guia**: compra cartas.
  - **Descarrego**: reduz permanentemente o ataque da demanda.
- **Encerrar giro**: a demanda ataca (a proteção absorve parte do dano), você
  recebe mais Axé (até 6) e compra até 5 cartas.
- **Vitória:** a demanda chega a 0. **Derrota:** a Harmonia do terreiro chega a 0.
- Soltar a carta fora da gira, ou sem Axé suficiente, devolve-a à mão.

## Comandos

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm test         # testes unitários (Vitest)
npm run lint     # ESLint
npm run build    # build de produção
```

## Estrutura

```
src/
├── config/constants.js          # tela, cartas, mesa, mão, movimento e regras
├── data/cardCatalog.js          # catálogo das 12 cartas
├── utils/                       # math (lerp, clamp) e random (seed, shuffle)
├── game/
│   ├── rules/gameLogic.js       # regras PURAS: createGame, playCard, endTurn...
│   ├── handLayout.js            # leque da mão (função pura)
│   ├── CardMotion.js            # hover, arraste, pulso e fade (sem Pixi)
│   ├── CardView.js              # carta visual e interativa
│   ├── Hand.js                  # cria/organiza/remove as cartas da mão
│   ├── DragController.js        # arrastar e soltar (mouse e toque)
│   ├── DropZone.js              # a gira (área de soltar)
│   ├── Hud.js                   # Harmonia, demanda, Axé, mensagens
│   ├── GameOverlay.js           # vitória/derrota e reinício
│   ├── TerreiroScene.js         # orquestra estado + views
│   └── ui/                      # Button, createLabel
├── hooks/usePixiApp.js          # ciclo de vida do Pixi (init/destroy)
└── components/GameCanvas.jsx    # ponte React e Pixi
```

## Decisões de arquitetura

- **Regras separadas da renderização:** `gameLogic.js` é puro e testado; a cena
  só traduz entrada do jogador em chamadas a ele e redesenha.
- **Estado imutável:** cada ação devolve um novo estado.
- **Movimento testável:** `CardMotion` recebe tempo e devolve a pose.
- **Drag desacoplado:** `DragController` fala com o jogo apenas por callbacks.
- **Balanceamento em um lugar só:** custos, vida, ataque e Axé em
  `constants.js` e `cardCatalog.js`.

## Ícones e telas pequenas

Ataque, defesa e passe aparecem como **ícones** (espada, escudo e um ícone por
passe), com o valor em tamanho grande. A legenda fica em "Como jogar".

- **Fonte única dos ícones:** `config/icons.js` guarda os caminhos SVG. O Pixi
  os desenha (`createIcon`) e a legenda HTML os reutiliza (`IconLegend`).
- **Layout responsivo:** `config/layout.js` escolhe o tamanho lógico do canvas
  pela proporção da tela: *paisagem* (altura 540, largura 720–1000) ou *retrato*
  (largura 480, altura 760–900). Cada formato tem sua disposição de HUD, mesa,
  botão e mão. Tudo é função pura e testada.
- **Escala por CSS:** o canvas ocupa a tela mantendo a proporção; em tablets
  tudo aparece maior. A resolução interna acompanha a ampliação para manter a
  nitidez.
- **Girar o aparelho:** o canvas é recriado com o outro layout e a partida
  continua (o estado vive na `session`, fora do Pixi).
- **Toque:** arrastar bloqueia a rolagem apenas sobre o canvas
  (`touch-action: none`); botões têm pelo menos 48 px de altura lógica.

## Elementos da demanda

Ao iniciar a partida, a demanda recebe um elemento sorteado: **Fogo, Ar, Terra
ou Água** (aparece ao lado do nome, com a lista de quem ela teme e resiste).

- Contra uma demanda de **Fogo**: entidade de **Água** causa **+30%** de dano;
  entidade de **Terra** causa **metade**. Os demais elementos causam dano normal.
- Em todos os casos o resultado é **arredondado para baixo** (ex.: Água com 5 de
  ataque causa 6; Terra com 5 causa 2; Terra com 1 causa 0).
- O elemento só altera o **dano**; defesa e passe não mudam.
- As cartas mostram um selo **+30%** (verde) ou **½** (vermelho) conforme a
  demanda atual.

Para as outras demandas, o mesmo ciclo vale: **Água vence Fogo, Fogo vence
Terra, Terra vence Ar, Ar vence Água**. Quem vence a demanda causa +30%; quem a
demanda vence causa metade. Entidades de **Mata** são neutras. Tudo isso fica em
`game/rules/elements.js`.

## Cartas

São 20 entidades (2 cópias de cada no baralho): 8 novas, incluindo Caboclo Cobra
Coral, Zé Pelintra, Pombagira Sete Saias, Vovó Cambinda, Caboclo Arranca-Toco,
Erê Doum, Seu Marujo e Cigana Carmencita. O catálogo fica em
`data/cardCatalog.js` e os prompts de arte em `scripts/artPrompts.mjs`.

## Sacramentos e Demanda suprema

Cada **vitória** (não conta o tutorial) rende **1 sacramento**. Com **5**,
libera-se a **Demanda suprema**, um nível acima do Difícil e com chances bem
baixas de vitória. Ela continua liberada depois. O progresso fica salvo no
navegador (`localStorage`). Lógica pura em `game/progress.js`.

## Dificuldades

| Nível | Harmonia | Vida da demanda | Ataque inicial | Cresce por giro | Vitórias de um jogador automático* |
|---|---|---|---|---|---|
| Fácil | 32 | 50 | 6 | +2 | ~94% |
| Normal | 30 | 52 | 7 | +2 | ~61% |
| Difícil | 28 | 56 | 7 | +2 | ~31% |
| Demanda suprema | 26 | 58 | 8 | +2 | ~3% |

\* Simulação de 1.500 partidas com um jogador que sempre joga a carta de maior
valor por Axé, já considerando o elemento; pessoas costumam jogar melhor. Os
números ficam em `data/difficulties.js`.

## Efeitos e sons

- **Fim de cada giro** (sequência de ~1 s, com a entrada travada): a demanda
  ataca (clarão e partículas), a proteção reage ("Bloqueou N"), o dano atinge
  a Harmonia (tremor da tela), e um novo giro começa ("Giro N" e faíscas no Axé).
- Também há efeitos ao **jogar uma carta** (cor do elemento, dano, +30%/½, cura)
  e **confete** na vitória. Código em `game/effects/` (partículas e agendamento
  são puros e testados).
- **Sons sintetizados** (Web Audio, sem arquivos): pegar carta, jogar, elemento
  forte/fraco, ataque, bloqueio, cura, compra, novo giro, vitória, derrota,
  liberação da Demanda suprema e cliques. Botão **Som** liga/desliga (salvo).
  Definições em `game/audio/soundDefs.js`.

## Anúncios

Colunas de anúncio **nas laterais** em telas largas (>= 1100 px) e uma faixa
**só no rodapé** em celulares e tablets. O canvas desconta esse espaço, então
nada cobre o jogo. Por padrão aparecem espaços reservados "Publicidade"; para
ativar o Google AdSense, preencha `client` e os `slots` em `config/ads.js`.
Para desligar tudo, `enabled: false`.

> Antes de publicar com anúncios personalizados, é preciso um aviso/consentimento
> de cookies (LGPD) e seguir as políticas do AdSense. Isso não está incluído.

## Tutorial guiado (10 passos)

Jogado no próprio tabuleiro, com mão fixa e demanda de Fogo: objetivo, Axé,
ícones, jogar uma carta, **elementos**, defesa, encerrar o giro e passe de
cura. Contornos pulsantes mostram o que olhar ou tocar; nos passos de ação só a
jogada esperada é aceita. Texto e ordem em `game/tutorial/tutorialSteps.js`.
