export interface Point {
  lat: number;
  lng: number;
  label?: string;
}

export function routeCost(order: number[], matrix: number[][]): number {
  let cost = 0;
  for (let i = 0; i < order.length - 1; i++) {
    cost += matrix[order[i]][order[i + 1]];
  }
  return cost;
}

export function bruteForceTSP(matrix: number[][], start: number = 0): number[] {
  const n = matrix.length;
  const nodes: number[] = [];
  for (let i = 0; i < n; i++) if (i !== start) nodes.push(i);

  let bestOrder: number[] | null = null;
  let bestCost = Infinity;

  function permute(arr: number[], l: number): void {
    if (l === arr.length) {
      const order = [start, ...arr];
      const cost = routeCost(order, matrix);
      if (cost < bestCost) {
        bestCost = cost;
        bestOrder = order;
      }
    } else {
      for (let i = l; i < arr.length; i++) {
        [arr[l], arr[i]] = [arr[i], arr[l]];
        permute(arr, l + 1);
        [arr[l], arr[i]] = [arr[i], arr[l]];
      }
    }
  }
  
  permute(nodes, 0);
  return bestOrder || [start];
}

export function nearestNeighbor(matrix: number[][], start: number = 0): number[] {
  const n = matrix.length;
  const visited = Array(n).fill(false);
  const order = [start];
  visited[start] = true;
  
  for (let k = 1; k < n; k++) {
    const u = order[order.length - 1];
    let best = -1;
    let bestDistance = Infinity;
    
    for (let v = 0; v < n; v++) {
      if (!visited[v] && matrix[u][v] < bestDistance) {
        best = v;
        bestDistance = matrix[u][v];
      }
    }
    
    visited[best] = true;
    order.push(best);
  }
  
  return order;
}

export function twoOpt(order: number[], matrix: number[][]): number[] {
  let best = order.slice();
  let improved = true;
  let bestCost = routeCost(best, matrix);
  
  while (improved) {
    improved = false;
    for (let i = 1; i < best.length - 2; i++) {
      for (let k = i + 1; k < best.length; k++) {
        const candidate = best.slice(0, i).concat(
          best.slice(i, k + 1).reverse(),
          best.slice(k + 1)
        );
        const cost = routeCost(candidate, matrix);
        if (cost < bestCost) {
          best = candidate;
          bestCost = cost;
          improved = true;
        }
      }
    }
  }
  
  return best;
}

export function threeOpt(order: number[], matrix: number[][]): number[] {
  let best = order.slice();
  let improved = true;
  let bestCost = routeCost(best, matrix);
  
  while (improved) {
    improved = false;
    for (let i = 1; i < best.length - 4; i++) {
      for (let j = i + 1; j < best.length - 2; j++) {
        for (let k = j + 1; k < best.length; k++) {
          // Probar las 7 posibles combinaciones de 3-opt
          const candidates = [
            best.slice(0, i).concat(best.slice(i, j).reverse(), best.slice(j, k).reverse(), best.slice(k)),
            best.slice(0, i).concat(best.slice(i, j).reverse(), best.slice(j, k), best.slice(k)),
            best.slice(0, i).concat(best.slice(i, j), best.slice(j, k).reverse(), best.slice(k)),
            best.slice(0, i).concat(best.slice(i, j), best.slice(j, k), best.slice(k)),
            best.slice(0, i).concat(best.slice(k, best.length).reverse(), best.slice(j, k).reverse(), best.slice(i, j).reverse()),
            best.slice(0, i).concat(best.slice(k, best.length).reverse(), best.slice(j, k), best.slice(i, j).reverse()),
            best.slice(0, i).concat(best.slice(k, best.length).reverse(), best.slice(j, k).reverse(), best.slice(i, j))
          ];
          
          for (const candidate of candidates) {
            const cost = routeCost(candidate, matrix);
            if (cost < bestCost) {
              best = candidate;
              bestCost = cost;
              improved = true;
            }
          }
        }
      }
    }
  }
  
  return best;
}

export function insertionHeuristic(matrix: number[][], start: number = 0): number[] {
  const n = matrix.length;
  const unvisited: number[] = [];
  for (let i = 0; i < n; i++) if (i !== start) unvisited.push(i);
  
  let tour = [start];
  
  while (unvisited.length > 0) {
    let bestInsertion: number[] | null = null;
    let bestCost = Infinity;
    let bestNode = -1;
    
    // Para cada nodo no visitado
    for (const node of unvisited) {
      // Probar insertarlo en cada posición del tour actual
      for (let pos = 1; pos <= tour.length; pos++) {
        const newTour = tour.slice(0, pos).concat([node], tour.slice(pos));
        const cost = routeCost(newTour, matrix);
        
        if (cost < bestCost) {
          bestCost = cost;
          bestInsertion = newTour;
          bestNode = node;
        }
      }
    }
    
    if (bestInsertion) {
      tour = bestInsertion;
      unvisited.splice(unvisited.indexOf(bestNode), 1);
    }
  }
  
  return tour;
}

export function geneticAlgorithm(
  matrix: number[][], 
  start: number = 0, 
  populationSize: number = 20, 
  generations: number = 50
): number[] {
  const n = matrix.length;
  const population: number[][] = [];
  
  // Generar población inicial
  for (let i = 0; i < populationSize; i++) {
    const tour = [start];
    const remaining: number[] = [];
    for (let j = 0; j < n; j++) if (j !== start) remaining.push(j);
    
    // Shuffle remaining nodes
    for (let j = remaining.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [remaining[j], remaining[k]] = [remaining[k], remaining[j]];
    }
    tour.push(...remaining);
    population.push(tour);
  }
  
  // Evolución
  for (let gen = 0; gen < generations; gen++) {
    // Evaluar fitness
    const fitness = population.map(tour => 1 / (routeCost(tour, matrix) + 1));
    const totalFitness = fitness.reduce((sum, f) => sum + f, 0);
    
    // Nueva población
    const newPopulation: number[][] = [];
    
    // Elitismo: mantener el mejor
    let bestTour = population[0];
    let bestCost = routeCost(bestTour, matrix);
    for (let i = 1; i < population.length; i++) {
      const cost = routeCost(population[i], matrix);
      if (cost < bestCost) {
        bestCost = cost;
        bestTour = population[i];
      }
    }
    newPopulation.push(bestTour);
    
    // Generar resto de la población
    while (newPopulation.length < populationSize) {
      // Selección por ruleta
      const parent1 = selectParent(population, fitness, totalFitness);
      const parent2 = selectParent(population, fitness, totalFitness);
      
      // Crossover
      const child = crossover(parent1, parent2, start);
      
      // Mutación
      if (Math.random() < 0.1) {
        mutate(child);
      }
      
      newPopulation.push(child);
    }
    
    population.length = 0;
    population.push(...newPopulation);
  }
  
  // Retornar el mejor tour
  let bestTour = population[0];
  let bestCost = routeCost(bestTour, matrix);
  for (let i = 1; i < population.length; i++) {
    const cost = routeCost(population[i], matrix);
    if (cost < bestCost) {
      bestCost = cost;
      bestTour = population[i];
    }
  }
  
  return bestTour;
}

function selectParent(population: number[][], fitness: number[], totalFitness: number): number[] {
  const rand = Math.random() * totalFitness;
  let sum = 0;
  for (let i = 0; i < population.length; i++) {
    sum += fitness[i];
    if (sum >= rand) return population[i];
  }
  return population[population.length - 1];
}

function crossover(parent1: number[], parent2: number[], start: number): number[] {
  const n = parent1.length;
  const child = Array(n).fill(-1);
  child[0] = start;
  
  // Order Crossover (OX)
  const startPos = 1;
  const endPos = Math.floor(n / 2);
  
  // Copiar segmento del primer padre
  for (let i = startPos; i <= endPos; i++) {
    child[i] = parent1[i];
  }
  
  // Llenar el resto con elementos del segundo padre en orden
  let parent2Index = 1;
  for (let i = 1; i < n; i++) {
    if (child[i] === -1) {
      while (child.includes(parent2[parent2Index])) {
        parent2Index++;
      }
      child[i] = parent2[parent2Index];
      parent2Index++;
    }
  }
  
  return child;
}

function mutate(tour: number[]): void {
  // Swap mutation
  const i = 1 + Math.floor(Math.random() * (tour.length - 2));
  const j = 1 + Math.floor(Math.random() * (tour.length - 2));
  [tour[i], tour[j]] = [tour[j], tour[i]];
}

// TSP abierto: no regresa al punto de inicio
export function solveTSPOpen(matrix: number[][], start: number = 0): number[] {
  const n = matrix.length;
  
  // Para problemas pequeños (n ≤ 8), usar fuerza bruta
  if (n <= 8) {
    return bruteForceTSPOpen(matrix, start);
  }
  
  // Para problemas más grandes, probar múltiples heurísticas
  const candidates: number[][] = [];
  
  // 1. Nearest Neighbor (sin regreso)
  candidates.push(nearestNeighborOpen(matrix, start));
  
  // 2. Nearest Neighbor desde diferentes puntos de inicio
  for (let i = 1; i < Math.min(n, 5); i++) {
    candidates.push(nearestNeighborOpen(matrix, i));
  }
  
  // 3. Algoritmo de inserción
  candidates.push(insertionHeuristicOpen(matrix, start));
  
  // 4. Algoritmo genético (para problemas medianos)
  if (n <= 15) {
    candidates.push(geneticAlgorithmOpen(matrix, start, 30, 100));
  }
  
  // Elegir la mejor solución entre todos los candidatos
  let bestOrder = candidates[0];
  let bestCost = routeCostOpen(bestOrder, matrix);
  
  for (let i = 1; i < candidates.length; i++) {
    const cost = routeCostOpen(candidates[i], matrix);
    if (cost < bestCost) {
      bestCost = cost;
      bestOrder = candidates[i];
    }
  }
  
  return bestOrder;
}

export function solveTSP(matrix: number[][], start: number = 0): number[] {
  const n = matrix.length;
  
  // Para problemas pequeños (n ≤ 8), usar fuerza bruta para obtener la solución óptima
  if (n <= 8) {
    return bruteForceTSP(matrix, start);
  }
  
  // Para problemas más grandes, probar múltiples heurísticas y elegir la mejor
  const candidates: number[][] = [];
  
  // 1. Nearest Neighbor + 2-opt
  candidates.push(twoOpt(nearestNeighbor(matrix, start), matrix));
  
  // 2. Nearest Neighbor desde diferentes puntos de inicio + 2-opt
  for (let i = 1; i < Math.min(n, 5); i++) {
    candidates.push(twoOpt(nearestNeighbor(matrix, i), matrix));
  }
  
  // 3. Nearest Neighbor + 3-opt (más potente que 2-opt)
  candidates.push(threeOpt(nearestNeighbor(matrix, start), matrix));
  
  // 4. Algoritmo de inserción más sofisticado
  candidates.push(insertionHeuristic(matrix, start));
  
  // 5. Algoritmo genético (para problemas medianos)
  if (n <= 15) {
    candidates.push(geneticAlgorithm(matrix, start, 30, 100));
  }
  
  // Elegir la mejor solución entre todos los candidatos
  let bestOrder = candidates[0];
  let bestCost = routeCost(bestOrder, matrix);
  
  for (let i = 1; i < candidates.length; i++) {
    const cost = routeCost(candidates[i], matrix);
    if (cost < bestCost) {
      bestCost = cost;
      bestOrder = candidates[i];
    }
  }
  
  return bestOrder;
}

export function buildMatrixHaversine(points: Point[]): number[][] {
  const R = 6371000; // Radio de la Tierra en metros
  function haversine(a: Point, b: Point): number {
    const toRad = (d: number) => d * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const s1 = Math.sin(dLat / 2);
    const s2 = Math.sin(dLng / 2);
    const A = s1 * s1 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2;
    return 2 * R * Math.asin(Math.sqrt(A)); // metros
  }
  
  // velocidad media 28 km/h urbana aprox → 7.78 m/s (ajustable)
  const v = 7.78;
  const n = points.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
        continue;
      }
      const distance = haversine(points[i], points[j]);
      matrix[i][j] = distance / v; // segundos aprox
    }
  }
  
  return matrix;
}

// ===== FUNCIONES PARA TSP ABIERTO (sin regreso al inicio) =====

// Costo de ruta sin regreso al inicio
export function routeCostOpen(order: number[], matrix: number[][]): number {
  let cost = 0;
  for (let i = 0; i < order.length - 1; i++) {
    cost += matrix[order[i]][order[i + 1]];
  }
  return cost;
}

// Fuerza bruta para TSP abierto
export function bruteForceTSPOpen(matrix: number[][], start: number = 0): number[] {
  const n = matrix.length;
  const nodes: number[] = [];
  for (let i = 0; i < n; i++) if (i !== start) nodes.push(i);

  let bestOrder: number[] | null = null;
  let bestCost = Infinity;

  function permute(arr: number[], l: number): void {
    if (l === arr.length) {
      const order = [start, ...arr];
      const cost = routeCostOpen(order, matrix);
      if (cost < bestCost) {
        bestCost = cost;
        bestOrder = order;
      }
    } else {
      for (let i = l; i < arr.length; i++) {
        [arr[l], arr[i]] = [arr[i], arr[l]];
        permute(arr, l + 1);
        [arr[l], arr[i]] = [arr[i], arr[l]];
      }
    }
  }
  
  permute(nodes, 0);
  return bestOrder || [start];
}

// Nearest Neighbor para TSP abierto
export function nearestNeighborOpen(matrix: number[][], start: number = 0): number[] {
  const n = matrix.length;
  const visited = Array(n).fill(false);
  const order = [start];
  visited[start] = true;
  
  for (let k = 1; k < n; k++) {
    const u = order[order.length - 1];
    let best = -1;
    let bestDistance = Infinity;
    
    for (let v = 0; v < n; v++) {
      if (!visited[v] && matrix[u][v] < bestDistance) {
        best = v;
        bestDistance = matrix[u][v];
      }
    }
    
    visited[best] = true;
    order.push(best);
  }
  
  return order;
}

// Algoritmo de inserción para TSP abierto
export function insertionHeuristicOpen(matrix: number[][], start: number = 0): number[] {
  const n = matrix.length;
  const order = [start];
  
  for (let i = 1; i < n; i++) {
    let bestPosition = 0;
    let bestCost = Infinity;
    
    // Probar insertar en cada posición
    for (let pos = 0; pos <= order.length; pos++) {
      const candidate = [...order.slice(0, pos), i, ...order.slice(pos)];
      const cost = routeCostOpen(candidate, matrix);
      if (cost < bestCost) {
        bestCost = cost;
        bestPosition = pos;
      }
    }
    
    order.splice(bestPosition, 0, i);
  }
  
  return order;
}

// Algoritmo genético para TSP abierto
export function geneticAlgorithmOpen(matrix: number[][], start: number, populationSize: number, generations: number): number[] {
  const n = matrix.length;
  let population: number[][] = [];
  
  // Inicializar población
  for (let i = 0; i < populationSize; i++) {
    const tour = [start];
    const remaining = Array.from({length: n}, (_, i) => i).filter(x => x !== start);
    
    // Shuffle remaining nodes
    for (let j = remaining.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [remaining[j], remaining[k]] = [remaining[k], remaining[j]];
    }
    
    tour.push(...remaining);
    population.push(tour);
  }
  
  // Evolución
  for (let gen = 0; gen < generations; gen++) {
    // Evaluar fitness
    population.sort((a, b) => routeCostOpen(a, matrix) - routeCostOpen(b, matrix));
    
    // Seleccionar mejores
    const elite = population.slice(0, Math.floor(populationSize * 0.2));
    const newPopulation = [...elite];
    
    // Cruzamiento
    while (newPopulation.length < populationSize) {
      const parent1 = population[Math.floor(Math.random() * populationSize)];
      const parent2 = population[Math.floor(Math.random() * populationSize)];
      const child = crossoverOpen(parent1, parent2);
      
      // Mutación
      if (Math.random() < 0.1) {
        mutateOpen(child);
      }
      
      newPopulation.push(child);
    }
    
    population = newPopulation;
  }
  
  // Retornar mejor solución
  population.sort((a, b) => routeCostOpen(a, matrix) - routeCostOpen(b, matrix));
  return population[0];
}

// Cruzamiento para TSP abierto
function crossoverOpen(parent1: number[], parent2: number[]): number[] {
  const n = parent1.length;
  const child = Array(n).fill(-1);
  
  // Copiar primer elemento (start)
  child[0] = parent1[0];
  
  // Cruzamiento de orden
  const start = Math.floor(Math.random() * (n - 1)) + 1;
  const end = Math.floor(Math.random() * (n - 1)) + 1;
  
  const [startPos, endPos] = start < end ? [start, end] : [end, start];
  
  // Copiar segmento del primer padre
  for (let i = startPos; i <= endPos; i++) {
    child[i] = parent1[i];
  }
  
  // Llenar el resto con elementos del segundo padre en orden
  let parent2Index = 1;
  for (let i = 1; i < n; i++) {
    if (child[i] === -1) {
      while (child.includes(parent2[parent2Index])) {
        parent2Index++;
      }
      child[i] = parent2[parent2Index];
      parent2Index++;
    }
  }
  
  return child;
}

// Mutación para TSP abierto
function mutateOpen(tour: number[]): void {
  // Swap mutation
  const i = 1 + Math.floor(Math.random() * (tour.length - 2));
  const j = 1 + Math.floor(Math.random() * (tour.length - 2));
  [tour[i], tour[j]] = [tour[j], tour[i]];
}
