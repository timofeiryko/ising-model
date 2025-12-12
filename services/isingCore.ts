import { Spin, SimulationStats } from '../types';

/**
 * Creates a random N x N grid of spins
 */
export const createGrid = (n: number): Int8Array => {
  const grid = new Int8Array(n * n);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = Math.random() > 0.5 ? 1 : -1;
  }
  return grid;
};

/**
 * Performs one Monte Carlo Step (MCS)
 * One MCS is defined as N*N attempted flips.
 */
export const performMCS = (grid: Int8Array, size: number, temperature: number): void => {
  const N = size;
  const area = N * N;
  
  // Precompute exponentials for possible energy differences dE = {-8, -4, 0, 4, 8}
  // dE is 2 * s_i * sum(neighbors). Neighbors sum is -4, -2, 0, 2, 4.
  // dE values: -8, -4, 0, 4, 8.
  // We only check probability if dE > 0.
  const expTable: Record<number, number> = {};
  [4, 8].forEach(dE => {
    expTable[dE] = Math.exp(-dE / temperature);
  });

  for (let k = 0; k < area; k++) {
    // Pick random site
    const idx = Math.floor(Math.random() * area);
    const x = idx % N;
    const y = Math.floor(idx / N);

    const s = grid[idx];

    // Periodic Boundary Conditions
    const left = grid[y * N + ((x - 1 + N) % N)];
    const right = grid[y * N + ((x + 1) % N)];
    const top = grid[((y - 1 + N) % N) * N + x];
    const bottom = grid[((y + 1) % N) * N + x];

    const neighborSum = left + right + top + bottom;
    
    // Change in energy if we flip s to -s:
    // E_initial = -J * s * neighbors
    // E_final = -J * (-s) * neighbors
    // dE = E_final - E_initial = 2 * J * s * neighbors
    // Assuming J=1
    const dE = 2 * s * neighborSum;

    if (dE <= 0) {
      grid[idx] = -s as Spin; // Accept flip
    } else {
      if (Math.random() < expTable[dE]) {
        grid[idx] = -s as Spin; // Accept flip probabilistically
      }
    }
  }
};

/**
 * Analyzes clusters (domains) using BFS/Union-Find approach to get size distribution.
 * Returns distribution data for the chart.
 */
export const analyzeDomains = (grid: Int8Array, size: number): SimulationStats['domainData'] => {
  const N = size;
  const visited = new Uint8Array(N * N); // 0 = unvisited, 1 = visited
  const clusterSizes: number[] = [];

  const getIdx = (x: number, y: number) => y * N + x;

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const startIdx = getIdx(x, y);
      if (visited[startIdx]) continue;

      const spinType = grid[startIdx];
      let currentSize = 0;
      const queue: number[] = [startIdx];
      visited[startIdx] = 1;

      while (queue.length > 0) {
        const curr = queue.pop()!;
        currentSize++;
        
        const cx = curr % N;
        const cy = Math.floor(curr / N);

        // Check 4 neighbors
        const neighbors = [
            { nx: (cx + 1) % N, ny: cy },
            { nx: (cx - 1 + N) % N, ny: cy },
            { nx: cx, ny: (cy + 1) % N },
            { nx: cx, ny: (cy - 1 + N) % N }
        ];

        for (const {nx, ny} of neighbors) {
            const nIdx = getIdx(nx, ny);
            if (!visited[nIdx] && grid[nIdx] === spinType) {
                visited[nIdx] = 1;
                queue.push(nIdx);
            }
        }
      }
      clusterSizes.push(currentSize);
    }
  }

  // Aggregate sizes for histogram
  const distribution: Record<number, number> = {};
  clusterSizes.forEach(s => {
    distribution[s] = (distribution[s] || 0) + 1;
  });

  // Convert to array format for Recharts
  return Object.entries(distribution)
    .map(([s, count]) => ({ size: Number(s), count }))
    .sort((a, b) => a.size - b.size);
};