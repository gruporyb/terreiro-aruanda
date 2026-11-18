import ElementGuide from "../components/ElementGuide.jsx";
import IconLegend from "../components/IconLegend.jsx";
import SoundToggle from "../components/SoundToggle.jsx";
import { DIFFICULTIES, DIFFICULTY_ORDER } from "../data/difficulties.js";
import { sound } from "../game/audio/sound.js";
import {
  SACRAMENTOS_TO_UNLOCK,
  isDifficultyUnlocked,
  sacramentosToGo,
} from "../game/progress.js";

function Sacramentos({ progress }) {
  const message = progress.supremeUnlocked
    ? `Sacramentos: ${progress.sacramentos}. Demanda suprema liberada!`
    : `Sacramentos: ${progress.sacramentos}/${SACRAMENTOS_TO_UNLOCK}. Faltam ${sacramentosToGo(progress)} vitória(s) para liberar a Demanda suprema.`;

  return (
    <section className="sacramentos" aria-label="Sacramentos">
      <div className="sacramentos__dots" aria-hidden="true">
        {Array.from({ length: SACRAMENTOS_TO_UNLOCK }, (_, index) => (
          <span key={index} className={index < progress.sacramentos ? "dot dot--full" : "dot"} />
        ))}
      </div>
      <p className="sacramentos__text">{message}</p>
    </section>
  );
}

/** Tela inicial: dificuldade, sacramentos, jogar e tutorial. */
export default function MainMenu({
  difficulty,
  onDifficultyChange,
  progress,
  isTutorialDone,
  isMuted,
  onToggleMute,
  onPlay,
  onTutorial,
}) {
  const click = (action) => () => {
    sound.play("click");
    action();
  };

  return (
    <main className="menu">
      <div className="menu__top">
        <SoundToggle isMuted={isMuted} onToggle={onToggleMute} />
      </div>
      <h1 className="menu__title">Terreiro de Aruanda</h1>
      <p className="menu__subtitle">O Jogo de Cartas</p>

      <Sacramentos progress={progress} />

      <fieldset className="difficulty">
        <legend className="difficulty__legend">Dificuldade</legend>
        {DIFFICULTY_ORDER.map((id) => {
          const { label, description } = DIFFICULTIES[id];
          const isUnlocked = isDifficultyUnlocked(id, progress);
          return (
            <label
              key={id}
              className={isUnlocked ? "difficulty__option" : "difficulty__option difficulty__option--locked"}
            >
              <input
                type="radio"
                name="difficulty"
                value={id}
                checked={difficulty === id}
                disabled={!isUnlocked}
                onChange={() => onDifficultyChange(id)}
              />
              <span className="difficulty__name">
                {label}
                {!isUnlocked && <span className="badge badge--muted">Bloqueada</span>}
              </span>
              <span className="difficulty__description">
                {isUnlocked
                  ? description
                  : `Vença ${SACRAMENTOS_TO_UNLOCK} partidas (${progress.sacramentos}/${SACRAMENTOS_TO_UNLOCK}) para liberar.`}
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="menu__actions">
        <button type="button" className="button button--primary" onClick={click(onPlay)}>
          Jogar
        </button>
        <button type="button" className="button button--secondary" onClick={click(onTutorial)}>
          Tutorial
          {!isTutorialDone && <span className="badge">Recomendado</span>}
        </button>
      </div>

      <details className="help">
        <summary>Como jogar, elementos e legenda dos ícones</summary>
        <p>
          Arraste as cartas da mão até a gira para chamar as entidades. Cada
          carta custa Axé (número no círculo escuro). Quando o Axé acabar,
          encerre o giro. Desfaça a demanda antes que a Harmonia do terreiro
          se esgote. Cada vitória rende um sacramento; com{" "}
          {SACRAMENTOS_TO_UNLOCK} você libera a Demanda suprema.
        </p>
        <IconLegend />
        <ElementGuide />
      </details>
    </main>
  );
}
