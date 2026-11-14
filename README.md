# Terreiro de Aruanda: O Jogo de Cartas

Jogo de cartas digital (React 18 + PixiJS v8 + Vite) com mão em leque e
arrastar e soltar.

## Como jogar

- Arraste uma carta da mão até a **gira** (a área central) para chamá-la.
- Cada carta custa **Axé**. Ela causa **Força** de dano na demanda, dá
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
