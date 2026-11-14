/**
 * Mini interpretador de caminhos SVG, limitado ao que os ícones usam:
 * comandos absolutos M, L, C e Z. Ser restrito deixa o desenho previsível
 * e testável sem depender do Pixi.
 */
const PARAM_COUNT = { M: 2, L: 2, C: 6, Z: 0 };

/** @returns {{ type: "M"|"L"|"C"|"Z", args: number[] }[]} */
export function parsePath(d) {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [];
  const commands = [];
  let index = 0;

  while (index < tokens.length) {
    const letter = tokens[index++];
    if (!(letter in PARAM_COUNT)) {
      throw new Error(`Comando de path não suportado: "${letter}"`);
    }

    const count = PARAM_COUNT[letter];
    if (count === 0) {
      commands.push({ type: "Z", args: [] });
      continue;
    }

    // Coordenadas repetidas após um comando repetem-no (e M vira L).
    let type = letter;
    do {
      const args = tokens.slice(index, index + count).map(Number);
      if (args.length !== count || args.some(Number.isNaN)) {
        throw new Error(`Parâmetros inválidos para "${type}" na posição ${index}`);
      }
      commands.push({ type, args });
      index += count;
      type = type === "M" ? "L" : type;
    } while (index < tokens.length && !/[A-Za-z]/.test(tokens[index]));
  }
  return commands;
}

/** Traça os comandos em um Graphics (sem preencher), com escala e deslocamento. */
export function tracePath(graphics, commands, { scale = 1, x = 0, y = 0 } = {}) {
  const move = (args) => args.map((value, i) => value * scale + (i % 2 === 0 ? x : y));

  for (const { type, args } of commands) {
    const points = move(args);
    if (type === "M") graphics.moveTo(...points);
    else if (type === "L") graphics.lineTo(...points);
    else if (type === "C") graphics.bezierCurveTo(...points);
    else graphics.closePath();
  }
  return graphics;
}
