import { DEMAND_ELEMENTS, MATCHUP_LABEL, getMatchupSummary } from "../game/rules/elements.js";

/** Tabela de elementos: contra cada demanda, quem causa +30% e quem causa metade. */
export default function ElementGuide() {
  return (
    <div className="element-guide">
      <p>
        Toda partida sorteia um elemento para a demanda. Entidades do elemento
        que a vence causam {MATCHUP_LABEL.strong} de dano; as do elemento que
        ela vence causam metade. Os valores são arredondados para baixo. Mata é
        neutra.
      </p>
      <table>
        <thead>
          <tr>
            <th>Demanda de</th>
            <th>{MATCHUP_LABEL.strong}</th>
            <th>{MATCHUP_LABEL.weak}</th>
          </tr>
        </thead>
        <tbody>
          {DEMAND_ELEMENTS.map((element) => {
            const { weakTo, resists } = getMatchupSummary(element);
            return (
              <tr key={element}>
                <th scope="row">{element}</th>
                <td>{weakTo}</td>
                <td>{resists}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
