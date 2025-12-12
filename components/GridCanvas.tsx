import React, { useRef, useEffect } from 'react';

interface GridCanvasProps {
  grid: Int8Array;
  size: number;
}

const GridCanvas: React.FC<GridCanvasProps> = ({ grid, size }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Fixed canvas display size for layout, but internal resolution matches grid
    // Or we can scale. Let's scale up pixels for visibility.
    // However, for 128x128, drawing 1:1 on a 500px canvas requires scaling.
    
    const displaySize = 600; // max width in px
    canvas.width = displaySize;
    canvas.height = displaySize;
    
    const cellSize = displaySize / size;

    // Clear background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, displaySize, displaySize);

    // Render grid
    // Optimization: Draw all UP spins in one batch, DOWN in another?
    // Actually, simple rect iteration is fast enough for < 256x256 in modern JS.
    
    for (let i = 0; i < grid.length; i++) {
        const val = grid[i];
        const x = (i % size) * cellSize;
        const y = Math.floor(i / size) * cellSize;

        // Visuals: +1 = Red, -1 = Blue
        ctx.fillStyle = val === 1 ? '#ef4444' : '#3b82f6'; // Tailwind red-500, blue-500
        
        // Use a slightly smaller rect to show grid lines if desired, or full for solid blocks.
        // Full blocks look better for domain visualization.
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(cellSize), Math.ceil(cellSize));
    }

  }, [grid, size]); // Re-render when grid object reference changes or size changes

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-auto aspect-square border-4 border-slate-700 rounded-lg shadow-xl bg-slate-900"
    />
  );
};

export default GridCanvas;