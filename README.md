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

## Tutorial e dificuldade

**Menu inicial:** escolha a dificuldade (Fácil, Normal ou Difícil), toque em
*Jogar* ou faça o *Tutorial*. A dificuldade e a conclusão do tutorial ficam
salvas no navegador (`localStorage`, com reserva se estiver indisponível).

| Nível | Harmonia | Vida da demanda | Ataque inicial | Cresce por giro | Vitórias de um jogador automático* |
|---|---|---|---|---|---|
| Fácil | 32 | 55 | 7 | +2 | ~91% |
| Normal | 30 | 60 | 7 | +2 | ~65% |
| Difícil | 28 | 64 | 7 | +2 | ~30–35% |

\* Simulação de 1.000 partidas com um jogador que sempre joga a carta de maior valor por Axé;
pessoas costumam jogar melhor. Os números ficam em `data/difficulties.js`.

**Tutorial guiado (9 passos)**, jogado no próprio tabuleiro com uma mão fixa:
objetivo, Axé, ícones, jogar uma carta de ataque, defesa, encerrar o giro e
passe de cura. Contornos pulsantes mostram o que olhar ou tocar; nos passos de
ação só a jogada esperada é aceita (as outras mostram uma dica).
Os textos e a ordem ficam em `game/tutorial/tutorialSteps.js`.

### Estrutura nova

```
src/
├── data/difficulties.js             # rulesets dos níveis (e o do tutorial)
├── game/
│   ├── session.js                   # modo, dificuldade, estado e passo do tutorial
│   ├── rules/deck.js                # baralho aleatório e de ordem fixa
│   └── tutorial/
│       ├── tutorialSteps.js         # roteiro + verificação de ações (puro)
│       ├── tutorialGame.js          # partida de treino com mão fixa
│       ├── TutorialPanel.js         # caixa de dicas
│       └── TutorialHighlight.js     # contornos pulsantes
├── screens/MainMenu.jsx, GameScreen.jsx
└── hooks/usePersistentState.js
```
