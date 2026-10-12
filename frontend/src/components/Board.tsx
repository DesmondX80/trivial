import React from 'react';
import type { BoardCell, Player, Category } from '../types/game';

const CATEGORY_COLORS: Record<Category, string> = {
  geography: '#3b82f6',
  entertainment: '#ec4899',
  history: '#eab308',
  science: '#22c55e',
  sports: '#f97316',
  arts: '#a855f7',
};

interface BoardProps {
  cells: BoardCell[];
  players: Player[];
  onCellClick?: (cellId: number) => void;
}

export const Board: React.FC<BoardProps> = ({ cells, players, onCellClick }) => {
  const size = 600;
  const center = size / 2;

  return (
      <div className="flex flex-col items-center justify-center bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-800">
        <h2 className="text-xl font-bold text-white mb-4">Trivial Pursuit - Pelilauta</h2>
        <svg width={size} height={size} className="overflow-visible">
          <circle cx={center} cy={center} r={240} fill="none" stroke="#334155" strokeWidth="2" />
          <circle cx={center} cy={center} r={120} fill="none" stroke="#334155" strokeWidth="2" />

          {cells.filter(c => c.isSpoke).map((cell, idx) => (
              <line
                  key={`spoke-${idx}`}
                  x1={center}
                  y1={center}
                  x2={cell.x}
                  y2={cell.y}
                  stroke="#475569"
                  strokeWidth="3"
                  strokeDasharray="4"
              />
          ))}

          {cells.map((cell) => {
            const color = CATEGORY_COLORS[cell.category];
            return (
                <g key={cell.id} onClick={() => onCellClick && onCellClick(cell.id)} className="cursor-pointer group">
                  <circle
                      cx={cell.x}
                      cy={cell.y}
                      r={cell.isSpoke ? 18 : 14}
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-transform duration-200 group-hover:scale-125"
                  />
                  <text
                      x={cell.x}
                      y={cell.y + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      pointerEvents="none"
                  >
                    {cell.id}
                  </text>
                </g>
            );
          })}

          <circle cx={center} cy={center} r={35} fill="#1e293b" stroke="#e2e8f0" strokeWidth="3" />
          <text x={center} y={center + 4} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold">
            START
          </text>

          {players.map((player) => {
            const cell = cells.find(c => c.id === player.position) || cells[0];
            const offsetX = (player.id * 6) - 9;
            const offsetY = -10;

            return (
                <g key={player.id} transform={`translate(${cell.x + offsetX}, ${cell.y + offsetY})`}>
                  <circle r="9" fill={player.color} stroke="#0f172a" strokeWidth="2" />
                  <text y="3" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                    {player.name.charAt(0)}
                  </text>
                </g>
            );
          })}
        </svg>
      </div>
  );
};