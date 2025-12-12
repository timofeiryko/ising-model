import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import GridCanvas from './components/GridCanvas';
import DistributionChart from './components/DistributionChart';
import { createGrid, performMCS, analyzeDomains } from './services/isingCore';
import { CRITICAL_TEMPERATURE } from './types';

const SIZES = [32, 64, 100, 128, 200];
const DEFAULT_SIZE = 128;
const DEFAULT_TEMP = CRITICAL_TEMPERATURE;

// Speed factors: < 1 means fractional updates per frame (slow motion), > 1 means multiple updates (fast forward)
const SPEED_LEVELS = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 20];
const DEFAULT_SPEED_INDEX = 5; // Index of '1' in SPEED_LEVELS

const App: React.FC = () => {
  // State
  const [size, setSize] = useState<number>(DEFAULT_SIZE);
  const [temperature, setTemperature] = useState<number>(DEFAULT_TEMP);
  const [speedIndex, setSpeedIndex] = useState<number>(DEFAULT_SPEED_INDEX);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [gridData, setGridData] = useState<Int8Array>(() => createGrid(DEFAULT_SIZE));
  const [stats, setStats] = useState<{ size: number; count: number }[]>([]);
  
  // Refs for animation loop to avoid stale closures
  const gridRef = useRef<Int8Array>(gridData);
  const runningRef = useRef<boolean>(isRunning);
  const tempRef = useRef<number>(temperature);
  const sizeRef = useRef<number>(size);
  const speedRef = useRef<number>(SPEED_LEVELS[DEFAULT_SPEED_INDEX]);
  const accumulatorRef = useRef<number>(0);
  const reqRef = useRef<number>();
  const frameCountRef = useRef<number>(0);

  // Sync refs with state
  useEffect(() => { runningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { tempRef.current = temperature; }, [temperature]);
  useEffect(() => { speedRef.current = SPEED_LEVELS[speedIndex]; }, [speedIndex]);
  
  // Handle Size Change (Resets Grid)
  useEffect(() => {
    sizeRef.current = size;
    const newGrid = createGrid(size);
    gridRef.current = newGrid;
    setGridData(newGrid);
    setStats([]); // clear stats on reset
    setIsRunning(false);
    accumulatorRef.current = 0;
  }, [size]);

  // Main Simulation Loop
  const loop = useCallback(() => {
    if (runningRef.current) {
      // Accumulate fractional speed
      accumulatorRef.current += speedRef.current;
      
      // Determine how many steps to take this frame
      const updatesToPerform = Math.floor(accumulatorRef.current);
      
      if (updatesToPerform > 0) {
        // Consume the accumulated steps
        accumulatorRef.current -= updatesToPerform;

        // Physics updates
        for (let i = 0; i < updatesToPerform; i++) {
          performMCS(gridRef.current, sizeRef.current, tempRef.current);
        }
        
        // Update Grid View
        setGridData(new Int8Array(gridRef.current));

        // Update Stats
        // If speed is slow (< 1 update/frame), update stats every time we physically update.
        // If speed is fast, throttle stats update to every 10 frames to save CPU.
        frameCountRef.current += 1;
        const shouldUpdateStats = speedRef.current < 1 || frameCountRef.current % 10 === 0;

        if (shouldUpdateStats) {
          const domainDist = analyzeDomains(gridRef.current, sizeRef.current);
          setStats(domainDist);
        }
      }
    }
    reqRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current!);
  }, [loop]);

  // Actions
  const handleReset = () => {
    const newGrid = createGrid(size);
    gridRef.current = newGrid;
    setGridData(newGrid);
    setStats([]);
    setIsRunning(false);
    frameCountRef.current = 0;
    accumulatorRef.current = 0;
  };

  const handleStep = () => {
    performMCS(gridRef.current, sizeRef.current, tempRef.current);
    setGridData(new Int8Array(gridRef.current));
    const domainDist = analyzeDomains(gridRef.current, sizeRef.current);
    setStats(domainDist);
  };

  const currentSpeedValue = SPEED_LEVELS[speedIndex];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <header className="max-w-7xl mx-auto mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-blue-400 font-serif tracking-wider">
          2D Модель Изинга: Критичность
        </h1>
        <p className="text-slate-400">Симуляция фазовых переходов и ферромагнетизма</p>
      </header>

      {/* Controls Area */}
      <div className="max-w-7xl mx-auto bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mb-8">
        <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
          
          {/* Sliders */}
          <div className="flex-1 w-full space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Температура (T / T<sub>c</sub>): <span className="text-blue-400 font-mono">{(temperature / CRITICAL_TEMPERATURE).toFixed(2)}</span>
                </label>
                <span className="text-xs text-slate-500 font-mono">T = {temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.01"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Холод (Упорядоч.)</span>
                <span>Критическая T<sub>c</sub></span>
                <span>Жара (Хаос)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Размер решетки (N x N): <span className="text-blue-400 font-mono">{size}</span>
                </label>
              </div>
              <input
                type="range"
                min="0"
                max={SIZES.length - 1}
                step="1"
                value={SIZES.indexOf(size)}
                onChange={(e) => setSize(SIZES[parseInt(e.target.value)])}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                {SIZES.map(s => <span key={s}>{s}</span>)}
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Скорость симуляции: <span className="text-blue-400 font-mono">x{currentSpeedValue}</span>
                </label>
                <span className="text-xs text-slate-500 font-mono">{currentSpeedValue >= 1 ? `${currentSpeedValue} MCS/кадр` : `1 MCS / ${Math.round(1/currentSpeedValue)} кадров`}</span>
              </div>
              <input
                type="range"
                min="0"
                max={SPEED_LEVELS.length - 1}
                step="1"
                value={speedIndex}
                onChange={(e) => setSpeedIndex(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                 <span>Медленно</span>
                 <span>Нормально</span>
                 <span>Быстро</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
             <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                isRunning 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
              }`}
            >
              {isRunning ? <><Pause size={20} /> Стоп</> : <><Play size={20} /> Старт</>}
            </button>

            <button
              onClick={handleStep}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipForward size={20} /> Шаг
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-red-900/50 hover:text-red-200 text-slate-200 rounded-lg font-medium transition-colors"
            >
              <RotateCcw size={20} /> Сброс
            </button>
          </div>
        </div>
      </div>

      {/* Visualization Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Simulation Canvas */}
        <div className="flex flex-col items-center justify-center">
          <GridCanvas grid={gridData} size={size} />
          <p className="mt-4 text-slate-400 text-sm italic">
            Красный: Спин Вверх (+1), Синий: Спин Вниз (-1)
          </p>
        </div>

        {/* Right: Statistics */}
        <div className="flex flex-col space-y-4">
           {/* Chart */}
           <div className="flex-1">
             <DistributionChart data={stats} />
             <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 text-sm text-slate-300">
               <h4 className="font-semibold text-blue-400 mb-2">О физике процесса:</h4>
               <p className="mb-2">
                 Вблизи критической температуры (T ≈ 2.27), система претерпевает фазовый переход второго рода.
               </p>
               <p>
                 График показывает <strong>степенной закон</strong> распределения размеров доменов. В критической точке график должен выпрямляться в логарифмическом масштабе, что свидетельствует о масштабируемости (scale invariance) системы.
               </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;