import { TileData } from '../types'

export const tiles: TileData[] = [
  { letter: 'A', score: 1 },
  { letter: 'B', score: 3 },
  { letter: 'C', score: 3 },
  { letter: 'D', score: 2 },
  { letter: 'E', score: 1 },
  { letter: 'F', score: 4 },
  { letter: 'G', score: 2 },
  { letter: 'H', score: 4 },
  { letter: 'I', score: 1 },
  { letter: 'J', score: 8 },
  { letter: 'K', score: 5 },
  { letter: 'L', score: 1 },
  { letter: 'M', score: 3 },
  { letter: 'N', score: 1 },
  { letter: 'O', score: 1 },
  { letter: 'P', score: 3 },
  { letter: 'Q', score: 10 },
  { letter: 'R', score: 1 },
  { letter: 'S', score: 1 },
  { letter: 'T', score: 1 },
  { letter: 'U', score: 1 },
  { letter: 'V', score: 4 },
  { letter: 'W', score: 4 },
  { letter: 'X', score: 8 },
  { letter: 'Y', score: 4 },
  { letter: 'Z', score: 10 }
]

const tileCDF: Record<string, [number, number]> = {
  Z: [0, 0.00074],
  Q: [0.00074, 0.00169],
  J: [0.00169, 0.00319],
  X: [0.00319, 0.00469],
  K: [0.00469, 0.01239],
  V: [0.01239, 0.02219],
  B: [0.02219, 0.03719],
  P: [0.03719, 0.05619],
  G: [0.05619, 0.07619],
  Y: [0.07619, 0.09619],
  F: [0.09619, 0.11819],
  M: [0.11819, 0.14219],
  W: [0.14219, 0.16619],
  C: [0.16619, 0.19419],
  U: [0.19419, 0.22219],
  L: [0.22219, 0.26219],
  D: [0.26219, 0.30519],
  R: [0.30519, 0.36519],
  H: [0.36519, 0.42619],
  S: [0.42619, 0.48919],
  N: [0.48919, 0.55619],
  I: [0.55619, 0.62619],
  O: [0.62619, 0.70119],
  A: [0.70119, 0.78319],
  T: [0.78319, 0.87419],
  E: [0.87419, 1]
}

export const getLetterByProbability = (value: number): TileData => {
  const search = (
    randomValue: number,
    intervals: Array<[number, number]>,
    indexOffset: number = 0
  ): string | undefined => {
    console.log(indexOffset)

    const index = Math.floor(intervals.length / 2)
    const [lowerBound, upperBound] = intervals[index]

    if (lowerBound < randomValue && randomValue <= upperBound) {
      return Object.keys(tileCDF)[index + indexOffset]
    } else if (lowerBound === randomValue) {
      return Object.keys(tileCDF)[
        (index + indexOffset) === 0
          ? 0
          : (index + indexOffset) - 1
      ]
    } else if (randomValue < lowerBound) {
      return search(randomValue, intervals.slice(0, index), indexOffset)
    } else if (upperBound < randomValue) {
      return search(randomValue, intervals.slice(index), indexOffset + index)
    }
  }

  const l = search(value, Object.values(tileCDF))

  return tiles.find(({ letter }) => letter === l) as TileData
}

export const randomLetter = (): TileData => getLetterByProbability(Math.random())

/**
 * Fixed positions for Double Letter multipliers (like Scrabble)
 * Pattern creates a symmetric layout
 */
const DOUBLE_LETTER_POSITIONS: Array<[number, number]> = [
  [0, 3], [3, 0], [4, 1], [1, 4],
  [2, 2] // center
]

/**
 * Fixed positions for Triple Letter multipliers
 */
const TRIPLE_LETTER_POSITIONS: Array<[number, number]> = [
  [1, 1], [3, 3], [1, 3], [3, 1]
]

/**
 * Generates a random board with multipliers and modifiers
 */
export const generateRandomBoard = (): TileData[][] => {
  const board = [] as TileData[][]

  // Generate base board with letters
  for (let r = 0; r < 5; r++) {
    board[r] = [] as TileData[]
    for (let c = 0; c < 5; c++) {
      board[r][c] = randomLetter()
    }
  }

  // Add Double Letter multipliers at fixed positions
  DOUBLE_LETTER_POSITIONS.forEach(([row, col]) => {
    board[row][col] = {
      ...board[row][col],
      doubleLetterMultiplier: true
    }
  })

  // Add Triple Letter multipliers at fixed positions
  TRIPLE_LETTER_POSITIONS.forEach(([row, col]) => {
    board[row][col] = {
      ...board[row][col],
      tripleLetterMultiplier: true
    }
  })

  // Add 1 random Double Word multiplier (moves each round)
  const doubleWordRow = Math.floor(Math.random() * 5)
  const doubleWordCol = Math.floor(Math.random() * 5)
  board[doubleWordRow][doubleWordCol] = {
    ...board[doubleWordRow][doubleWordCol],
    doubleWordMultiplier: true
  }

  // Add 3-5 random gem tiles
  const numGems = Math.floor(Math.random() * 3) + 3 // 3-5 gems
  const gemPositions = new Set<string>()
  while (gemPositions.size < numGems) {
    const row = Math.floor(Math.random() * 5)
    const col = Math.floor(Math.random() * 5)
    const key = `${row},${col}`
    if (!gemPositions.has(key)) {
      gemPositions.add(key)
      board[row][col] = {
        ...board[row][col],
        hasGem: true
      }
    }
  }

  // Add 0-2 random frozen tiles
  const numFrozen = Math.floor(Math.random() * 3) // 0-2 frozen
  const frozenPositions = new Set<string>()
  while (frozenPositions.size < numFrozen) {
    const row = Math.floor(Math.random() * 5)
    const col = Math.floor(Math.random() * 5)
    const key = `${row},${col}`
    if (!frozenPositions.has(key) && !gemPositions.has(key)) {
      frozenPositions.add(key)
      board[row][col] = {
        ...board[row][col],
        isFrozen: true
      }
    }
  }

  return board
}

export const generateTitleBoard = (): TileData[][] => {
  const board = [] as TileData[][]

  for (let r = 0; r < 5; r++) {
    board[r] = [
      tiles[22], // W
      tiles[8], // I
      tiles[1], // B
      tiles[11], // L
      tiles[4] // E
    ] as TileData[]
  }

  return board
}
