import { useState, useEffect } from 'react';

export type CategoryKey = 'yleistieto' | 'historia' | 'maantieto' | 'biologia' | 'urheilu';

export interface CategoryInfo {
  name: string;
  color: string;
}

export interface BoardCell {
  id: number;
  category: CategoryKey;
  x: number;
  y: number;
  isCheckpoint?: boolean;
}

export interface Player {
  id: number;
  name: string;
  color: string;
  position: number;
  score: number;
}

export interface Question {
  id: number;
  category: CategoryKey;
  question: string;
  options: string[];
  correctIndex: number;
}

const CATEGORY_DATA: Record<CategoryKey, CategoryInfo> = {
  yleistieto: { name: 'Yleistieto', color: '#38bdf8' },
  historia: { name: 'Historia', color: '#facc15' },
  maantieto: { name: 'Maantieto', color: '#2dd4bf' },
  biologia: { name: 'Biologia', color: '#4ade80' },
  urheilu: { name: 'Urheilu', color: '#fb923c' },
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const generateBoardCells = (): BoardCell[] => {
  const cells: BoardCell[] = [];
  const totalCells = 18;
  const categoryKeys = Object.keys(CATEGORY_DATA) as CategoryKey[];

  const startY = 700;
  const endY = 80;
  const heightStep = (startY - endY) / (totalCells - 1);
  const centerX = 240;
  const amplitude = 120;

  for (let i = 0; i < totalCells; i++) {
    const y = startY - i * heightStep;
    const x = centerX + Math.sin(i * 0.65) * amplitude;
    const category = categoryKeys[i % categoryKeys.length];
    const isCheckpoint = i === 0 || i === Math.floor(totalCells / 2) || i === totalCells - 1;

    cells.push({
      id: i + 1,
      category,
      x,
      y,
      isCheckpoint
    });
  }
  return cells;
};

interface TacticalBoardProps {
  cells: BoardCell[];
  players: Player[];
  activePlayerId: number;
}

function TacticalBoard({ cells, players, activePlayerId }: TacticalBoardProps) {
  const width = 480;
  const height = 780;

  return (
      <div className="relative flex flex-col items-center justify-center bg-gray-900/90 p-4 md:p-6 rounded-3xl border border-gray-800 shadow-2xl">
        <div className="w-full flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
            <h2 className="text-xs font-mono font-bold tracking-widest text-gray-300 uppercase">
              RINTAMAKARTTA (18 SEKTORIKENTTÄÄ)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-gray-400 bg-gray-800/80 px-2 py-1 rounded border border-gray-700">
          SEKTORI: 01 - 18
        </span>
        </div>

        <svg width={width} height={height} className="overflow-visible max-w-full h-auto bg-gray-950/70 rounded-2xl border border-gray-800/80 shadow-inner">
          {cells.map((cell, idx) => {
            if (idx === 0) return null;
            const prevCell = cells[idx - 1];
            return (
                <line
                    key={`path-${cell.id}`}
                    x1={prevCell.x}
                    y1={prevCell.y}
                    x2={cell.x}
                    y2={cell.y}
                    stroke="#374151"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={cell.isCheckpoint ? "6 6" : "none"}
                />
            );
          })}

          {cells.map((cell) => {
            const cat = CATEGORY_DATA[cell.category];
            const radius = cell.isCheckpoint ? 18 : 14;

            return (
                <g key={cell.id}>
                  <circle
                      cx={cell.x}
                      cy={cell.y}
                      r={radius}
                      fill={cat.color}
                      stroke="#111827"
                      strokeWidth="3"
                  />
                  <text
                      x={cell.x}
                      y={cell.y + 4}
                      textAnchor="middle"
                      fill="#030712"
                      fontSize="10"
                      fontWeight="900"
                      pointerEvents="none"
                  >
                    {cell.id}
                  </text>
                </g>
            );
          })}

          {players.map((player) => {
            const currentCell = cells.find(c => c.id === player.position) || cells[0];
            const isCurrentTurn = player.id === activePlayerId;
            const offsetX = (player.id === 1) ? -12 : 12;

            return (
                <g key={player.id} transform={`translate(${currentCell.x + offsetX}, ${currentCell.y - 2})`}>
                  <circle r="12" fill={player.color} stroke="#030712" strokeWidth="2.5" />
                  <text y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
                    P{player.id}
                  </text>
                </g>
            );
          })}
        </svg>
      </div>
  );
}

export function App() {
  const [cells] = useState<BoardCell[]>(generateBoardCells());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('Ladataan kysymyksiä...');

  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'Alfa Joukkue', color: '#38bdf8', position: 1, score: 0 },
    { id: 2, name: 'Bravo Joukkue', color: '#f43f5e', position: 1, score: 0 },
  ]);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [usedQuestionIds, setUsedQuestionIds] = useState<number[]>([]);

  const [activeQuizModal, setActiveQuizModal] = useState<{
    player: Player;
    targetPosition: number;
    targetCell: BoardCell;
    question: Question;
  } | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);

  const activePlayer = players[activePlayerIndex];

  // Hakee kysymykset absoluuttisella IP-osoitteella 127.0.0.1
  const loadQuestionsFromBackend = async () => {
    setIsLoading(true);
    setStatusMessage('Otetaan yhteys backend-palvelimeen...');

    try {
      console.log('Tehdään fetch-kutsu osoitteeseen http://127.0.0.1:5000/api/questions');
      const res = await fetch('http://127.0.0.1:5000/api/questions');

      if (!res.ok) throw new Error('Verkkovirhe backendistä');

      const data = await res.json();
      console.log('Data vastaanotettu backendiltä:', data.length, 'kpl');

      if (data && data.length > 0) {
        setQuestions(data);
        setStatusMessage(`Ladattu ${data.length} kysymystä onnistuneesti netistä! 🌐`);
      } else {
        throw new Error('Tyhjä lista');
      }
    } catch (err: any) {
      console.error('Virhe haettaessa backendistä:', err.message);
      setStatusMessage('VIRHE: Backend ei vastaa tai yhteys puuttuu!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestionsFromBackend();
  }, []);

  const handleInitiateMove = () => {
    if (winner || activeQuizModal || isLoading || questions.length === 0) return;

    const targetPos = activePlayer.position + 1;
    if (targetPos > cells.length) return;

    const targetCell = cells.find(c => c.id === targetPos);
    if (!targetCell) return;

    let available = questions.filter(
        q => q.category === targetCell.category && !usedQuestionIds.includes(q.id)
    );

    if (available.length === 0) {
      available = questions.filter(q => !usedQuestionIds.includes(q.id));
    }

    if (available.length === 0) {
      setUsedQuestionIds([]);
      available = questions;
    }

    const selected = shuffleArray(available)[0];
    setUsedQuestionIds(prev => [...prev, selected.id]);

    setSelectedOption(null);
    setFeedback(null);
    setActiveQuizModal({
      player: activePlayer,
      targetPosition: targetPos,
      targetCell: targetCell,
      question: selected
    });
  };

  const handleAnswerSubmit = (optionIndex: number) => {
    if (!activeQuizModal || feedback !== null) return;

    setSelectedOption(optionIndex);
    const isCorrect = optionIndex === activeQuizModal.question.correctIndex;

    if (isCorrect) {
      setFeedback({ type: 'success', message: 'OIKEIN! SEKTORI VALLATTU! 🎖️' });
      setTimeout(() => {
        const newPos = activeQuizModal.targetPosition;
        setPlayers(prev => prev.map(p => {
          if (p.id === activePlayer.id) {
            const updated = { ...p, position: newPos, score: p.score + 150 };
            if (newPos >= cells.length) setWinner(updated);
            return updated;
          }
          return p;
        }));
        setActiveQuizModal(null);
        setFeedback(null);
        setSelectedOption(null);
        setActivePlayerIndex(prev => (prev + 1) % players.length);
      }, 1400);
    } else {
      const correctText = activeQuizModal.question.options[activeQuizModal.question.correctIndex];
      setFeedback({ type: 'error', message: `VÄÄRIN! Oikea vastaus: ${correctText}` });
      setTimeout(() => {
        setActiveQuizModal(null);
        setFeedback(null);
        setSelectedOption(null);
        setActivePlayerIndex(prev => (prev + 1) % players.length);
      }, 2200);
    }
  };

  const resetGame = () => {
    setPlayers([
      { id: 1, name: 'Alfa Joukkue', color: '#38bdf8', position: 1, score: 0 },
      { id: 2, name: 'Bravo Joukkue', color: '#f43f5e', position: 1, score: 0 },
    ]);
    setActivePlayerIndex(0);
    setUsedQuestionIds([]);
    setActiveQuizModal(null);
    setWinner(null);
    setFeedback(null);
    loadQuestionsFromBackend();
  };

  return (
      <div className="min-h-screen flex flex-col justify-between p-3 md:p-6 max-w-7xl mx-auto w-full text-white">
        <header className="flex flex-col md:flex-row items-center justify-between border-b border-gray-800 pb-4 mb-6 gap-4">
          <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase font-mono">
            TACTICAL TRIVIAL PURSUIT (LIVE API)
          </h1>
          <div className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl text-xs font-mono">
            <span>VUOROSSA: </span>
            <strong style={{ color: activePlayer.color }}>{activePlayer.name}</strong>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start my-auto">
          <div className="lg:col-span-7 flex justify-center w-full">
            <TacticalBoard cells={cells} players={players} activePlayerId={activePlayer.id} />
          </div>

          <div className="lg:col-span-5 flex flex-col gap-5 w-full">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
              <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 flex flex-col gap-3">
              <span className="text-xs font-mono text-indigo-400 bg-indigo-950 px-3 py-1.5 rounded-xl border border-indigo-900">
                {statusMessage}
              </span>
                <div className="text-xs font-mono text-gray-400">
                  Ladattuja kysymyksiä: <strong className="text-white">{questions.length} kpl</strong>
                </div>
              </div>

              <button
                  onClick={handleInitiateMove}
                  disabled={winner !== null || isLoading || questions.length === 0}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-lg"
              >
                {isLoading ? 'LADATAAN...' : 'ETENE SEURAAVAAN SEKTORIIN ➔'}
              </button>

              <button
                  onClick={resetGame}
                  disabled={isLoading}
                  className="py-2.5 text-xs font-mono font-semibold text-gray-400 hover:text-white bg-gray-950 hover:bg-gray-800 rounded-xl border border-gray-800 transition-colors cursor-pointer"
              >
                HAE UUDET KYSYMYKSET NETISTÄ (NOLLAA)
              </button>
            </div>
          </div>
        </main>

        {activeQuizModal && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-gray-900 border-2 border-gray-700 rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl flex flex-col gap-6">
                <div className="flex justify-between border-b border-gray-800 pb-4 text-xs font-mono text-gray-400">
                  <span>KATEGORIA: {CATEGORY_DATA[activeQuizModal.question.category].name}</span>
                  <span>SEKTORI {activeQuizModal.targetPosition}</span>
                </div>

                <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800">
                  <p className="text-lg md:text-xl font-bold text-white">
                    {activeQuizModal.question.question}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {activeQuizModal.question.options.map((optionText, idx) => (
                      <button
                          key={idx}
                          onClick={() => handleAnswerSubmit(idx)}
                          disabled={feedback !== null}
                          className="w-full text-left p-4 rounded-2xl border bg-gray-800 hover:bg-indigo-900/60 border-gray-700 text-gray-100 font-semibold cursor-pointer transition-all"
                      >
                        {optionText}
                      </button>
                  ))}
                </div>

                {feedback && (
                    <div className={`p-4 rounded-2xl text-center text-sm font-extrabold font-mono ${
                        feedback.type === 'success' ? 'bg-emerald-950 border border-emerald-500 text-emerald-200' : 'bg-rose-950 border border-rose-500 text-rose-200'
                    }`}>
                      {feedback.message}
                    </div>
                )}
              </div>
            </div>
        )}

        {winner && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
              <div className="bg-gray-900 border-2 border-emerald-500 rounded-3xl p-8 w-full max-w-md text-center flex flex-col gap-6">
                <h2 className="text-2xl font-black uppercase font-mono text-white">VOITTO SAAVUTETTU! 🏆</h2>
                <button
                    onClick={resetGame}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase rounded-2xl cursor-pointer"
                >
                  UUSI PELI
                </button>
              </div>
            </div>
        )}
      </div>
  );
}

export default App;