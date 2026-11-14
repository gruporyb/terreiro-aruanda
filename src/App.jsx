import GameCanvas from "./components/GameCanvas.jsx";

export default function App() {
  return (
    <main className="app">
      <h1 className="app__title">Terreiro de Aruanda: O Jogo de Cartas</h1>
      <GameCanvas />
      <p className="app__hint">
        Arraste as cartas da mão até a gira para chamar as entidades. Quando o
        Axé acabar, encerre o giro. Desfaça a demanda antes que a Harmonia do
        terreiro se esgote.
      </p>
    </main>
  );
}
