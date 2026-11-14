import IconLegend from "../components/IconLegend.jsx";
import { DIFFICULTIES, DIFFICULTY_ORDER } from "../data/difficulties.js";

/** Tela inicial: escolha de dificuldade, jogar e tutorial. */
export default function MainMenu({ difficulty, onDifficultyChange, isTutorialDone, onPlay, onTutorial }) {
  return (
    <main className="menu">
      <h1 className="menu__title">Terreiro de Aruanda</h1>
      <p className="menu__subtitle">O Jogo de Cartas</p>

      <fieldset className="difficulty">
        <legend className="difficulty__legend">Dificuldade</legend>
        {DIFFICULTY_ORDER.map((id) => {
          const { label, description } = DIFFICULTIES[id];
          return (
            <label key={id} className="difficulty__option">
              <input
                type="radio"
                name="difficulty"
                value={id}
                checked={difficulty === id}
                onChange={() => onDifficultyChange(id)}
              />
              <span className="difficulty__name">{label}</span>
              <span className="difficulty__description">{description}</span>
            </label>
          );
        })}
      </fieldset>

      <div className="menu__actions">
        <button type="button" className="button button--primary" onClick={onPlay}>
          Jogar
        </button>
        <button type="button" className="button button--secondary" onClick={onTutorial}>
          Tutorial
          {!isTutorialDone && <span className="badge">Recomendado</span>}
        </button>
      </div>

      <details className="help">
        <summary>Como jogar e legenda dos ícones</summary>
        <p>
          Arraste as cartas da mão até a gira para chamar as entidades. Cada
          carta custa Axé (número no círculo escuro). Quando o Axé acabar,
          encerre o giro. Desfaça a demanda antes que a Harmonia do terreiro
          se esgote.
        </p>
        <IconLegend />
      </details>
    </main>
  );
}
