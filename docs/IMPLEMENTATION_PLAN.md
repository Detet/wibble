# Wibble Implementation Plan - Competitive Multiplayer Spellcast Clone

## Game Structure

### Competitive Multiplayer Format
- **Game**: Consists of multiple rounds (5, 10, 15, etc. - selectable)
- **Gameplay**: Turn-based with shared board state
- **Shared Board**: All players interact with the same evolving 5x5 board
- **Tile Replacement**: When a player uses tiles, they're replaced with new random letters
- **Turn Timer**: 1 minute per turn (adjustable: 30s, 1m, 2m, 3m)
- **Scoring**: Points accumulate across all rounds
- **Winner**: Highest total score after all rounds

### Round Flow (Turn-Based)
1. Round starts with fresh 5x5 board (shared by all players)
2. **Player 1's Turn**:
   - Timer starts (1 minute default)
   - Player forms word by chaining tiles
   - Submits word → scores points/gems
   - Used tiles are removed and replaced with new random letters
   - Turn ends
3. **Player 2's Turn**:
   - Sees updated board (with Player 1's tiles replaced)
   - Forms word, submits, tiles replaced
   - Turn ends
4. Repeat for all players
5. After each player has taken X turns → Round ends
6. New round starts with fresh board
7. After final round → Winner declared

### Key Mechanics
- **Shared Board**: Board state is synchronized across all players
- **Evolving Board**: Board changes as tiles get used and replaced
- **Turn Order**: Players take turns sequentially (Player 1 → Player 2 → Player 3 → back to Player 1)
- **Spectating**: Players can watch opponent's turns in real-time

---

## Phase 1: Core Game Mechanics (Single Player Foundation)

### 1.1 Word Validation System
**Priority: CRITICAL**
- [ ] Integrate dictionary API or word list
- [ ] Validate words on submission (2+ letter minimum)
- [ ] Reject invalid words (no score)
- [ ] Display validation feedback

**Options:**
- Local word list (fast, offline)
- Dictionary API (WordsAPI, Free Dictionary API)

### 1.2 Enhanced Tile System
**Priority: HIGH**
- [ ] Add tile modifiers to TileData type:
  - `doubleLetterMultiplier: boolean` (DL)
  - `tripleLetterMultiplier: boolean` (TL)
  - `doubleWordMultiplier: boolean` (2x - pink frame)
  - `hasGem: boolean` (gem tile)
  - `isFrozen: boolean` (frozen - cannot use)
- [ ] Update board generation to place modifiers
- [ ] Render modifiers visually on tiles

**Multiplier Placement Rules:**
- DL/TL: Fixed positions on board (like Scrabble)
- 2x Word: Random position, moves each round
- Gems: 3-5 random tiles per board
- Frozen: 0-3 random tiles per board

### 1.3 Scoring System Overhaul
**Priority: HIGH**
- [ ] Calculate score with multipliers:
  1. Base letter scores
  2. Apply DL/TL multipliers to individual letters
  3. Apply 2x word multiplier if used
  4. Add long word bonus (+10 for 6+ letters)
- [ ] Display score breakdown before submission
- [ ] Update state machine with new scoring logic

### 1.4 Gem System
**Priority: MEDIUM**
- [ ] Add `gems: number` to game context (max 10)
- [ ] Award gems when using gem tiles
- [ ] Display gem count in UI
- [ ] Prevent gems exceeding 10 (discard overflow)

### 1.5 Power-Ups
**Priority: MEDIUM**
- [ ] **Shuffle** (1 gem): Rearrange existing letters on board (same letters, different positions)
  - Does NOT generate new letters
  - Randomizes the positions of all current letters
- [ ] **Wildcard** (3 gems): Click tile → choose any letter to replace it
- [ ] Add power-up buttons to UI
- [ ] Disable buttons when insufficient gems
- [ ] Update state machine with power-up actions

### 1.6 Turn Timer System
**Priority: HIGH**
- [ ] Add turn timer to game state
- [ ] Countdown display (1:00, 0:59, 0:58...)
- [ ] Auto-end turn when timer reaches 0:00
- [ ] Configurable timer duration (30s, 1m, 2m, 3m)
- [ ] Skip turn if timer expires (no points awarded)

### 1.7 Multi-Round & Turn Structure
**Priority: HIGH**
- [ ] Add game configuration:
  - `totalRounds: number` (5, 10, 15, etc.)
  - `turnsPerPlayer: number` (how many turns each player gets per round)
  - `turnDuration: number` (30, 60, 120, 180 seconds)
- [ ] Track current round number
- [ ] Track current player turn
- [ ] Generate new board each round (not each turn)
- [ ] Accumulate scores across rounds
- [ ] Display round-by-round scores
- [ ] End round after all players complete their turns
- [ ] End game after final round
- [ ] Show final results/winner screen

---

## Phase 2: Multiplayer Infrastructure

### 2.1 WebRTC Setup
**Priority: CRITICAL**
- [ ] Install peer-to-peer library (PeerJS or simple-peer)
- [ ] Create WebRTC connection manager
- [ ] Handle ICE candidates, SDP negotiation
- [ ] Implement reconnection logic

### 2.2 Invite Code System
**Priority: CRITICAL**
- [ ] Generate unique room codes (6-digit alphanumeric)
- [ ] Host creates room → gets invite code
- [ ] Guest joins room with invite code
- [ ] Use public STUN/TURN servers (Google, Twilio)
- [ ] No backend needed (serverless P2P)

**Flow:**
1. Player 1 clicks "Host Game"
2. Generate room code (e.g., "XJ4K92")
3. Display code to share with friends
4. Player 2 enters code, clicks "Join Game"
5. WebRTC connection established
6. Game lobby appears

### 2.3 Game State Synchronization
**Priority: CRITICAL**
- [ ] Host is authoritative (generates boards, controls turns, validates moves)
- [ ] Broadcast game state to all peers:
  - Current board (shared, evolving)
  - Current turn (which player is active)
  - Round number
  - Turn timer remaining
  - All player scores
- [ ] Turn management:
  - Only active player can make moves
  - Other players spectate in real-time
  - After word submission, turn passes to next player
  - Host replaces used tiles and broadcasts new board state
- [ ] Host validates words and broadcasts score updates
- [ ] Handle player disconnections gracefully (skip their turn)

### 2.4 Lobby System
**Priority: HIGH**
- [ ] Pre-game lobby UI:
  - Show connected players
  - Configure game settings (rounds, timer)
  - Ready/Not Ready status
  - Host can start game when all ready
- [ ] Player list with names/avatars
- [ ] Kick player option (host only)

### 2.5 Real-Time Updates
**Priority: MEDIUM**
- [ ] Turn indicator showing whose turn it is
- [ ] Live spectating - watch current player's moves in real-time
- [ ] Word submission animations (tiles disappearing, new tiles appearing)
- [ ] Score updates after each turn
- [ ] Round transition animations
- [ ] Final scoreboard

---

## Phase 3: UI/UX Polish

### 3.1 Visual Design
**Priority: MEDIUM**
- [ ] Tile animations (selection, submission, replacement)
- [ ] Multiplier tile styling:
  - DL: Blue border
  - TL: Dark blue border
  - 2x Word: Pink/magenta frame
  - Gem: Sparkle/diamond icon
  - Frozen: Ice/lock icon
- [ ] Timer warning (red when <10 seconds)
- [ ] Score animations (+15, +32, etc.)

### 3.2 Game Flow Screens
**Priority: MEDIUM**
- [ ] Main menu
- [ ] Host/Join selection
- [ ] Lobby screen
- [ ] In-game HUD (scores, timer, round #, gems)
- [ ] Round transition screen ("Round 2 of 5")
- [ ] Final results screen (winner + score breakdown)

### 3.3 Responsive Design
**Priority: LOW**
- [ ] Mobile-friendly touch controls
- [ ] Tablet optimization
- [ ] Desktop keyboard shortcuts (optional)

---

## Phase 4: Additional Features

### 4.1 Settings
**Priority: LOW**
- [ ] Sound effects toggle
- [ ] Music toggle
- [ ] Color theme (light/dark mode)
- [ ] Accessibility options

### 4.2 Statistics
**Priority: LOW**
- [ ] Personal best scores
- [ ] Total games played
- [ ] Win/loss record
- [ ] Longest word formed

---

## Technical Architecture

### State Management (XState)
```
gameStateMachine
├── mainMenu
├── hostLobby
├── guestLobby
├── game
│   ├── roundStarting
│   ├── roundActive
│   │   ├── myTurn (active player)
│   │   │   ├── idle
│   │   │   ├── chaining
│   │   │   └── wordSubmitted
│   │   └── opponentTurn (spectating)
│   ├── roundEnding
│   └── gameOver
└── disconnected
```

### Data Models

```typescript
interface TileData {
  letter: string
  score: number
  doubleLetterMultiplier: boolean
  tripleLetterMultiplier: boolean
  doubleWordMultiplier: boolean
  hasGem: boolean
  isFrozen: boolean
}

interface GameConfig {
  totalRounds: number
  turnsPerPlayer: number // how many turns each player gets per round
  turnDuration: number // seconds per turn
}

interface GameState {
  config: GameConfig
  currentRound: number
  currentPlayerIndex: number // which player's turn it is
  turnTimeRemaining: number
  board: TileData[][] // shared board, evolves as tiles get replaced
  players: PlayerData[]
  currentChain: [number, number][] // active player's current chain
  currentWord: string // active player's current word
  currentScore: number // active player's current score
}

interface PlayerData {
  id: string
  name: string
  gems: number // each player has their own gem count
  totalScore: number
  roundScores: number[]
  turnsCompleted: number // in current round
  isHost: boolean
  isReady: boolean
}

interface RoomConnection {
  roomCode: string
  isHost: boolean
  peers: PeerConnection[]
}
```

### WebRTC Message Types
```typescript
type Message =
  | { type: 'PLAYER_JOINED', player: PlayerData }
  | { type: 'PLAYER_LEFT', playerId: string }
  | { type: 'GAME_CONFIG', config: GameConfig }
  | { type: 'ROUND_START', round: number, board: TileData[][] }
  | { type: 'TURN_START', playerId: string, playerIndex: number }
  | { type: 'TIMER_UPDATE', timeRemaining: number }
  | { type: 'BOARD_UPDATE', board: TileData[][] } // after tiles replaced
  | { type: 'WORD_SUBMITTED', playerId: string, word: string, score: number, gemsEarned: number }
  | { type: 'TURN_END', playerId: string, newBoard: TileData[][] }
  | { type: 'POWER_UP_USED', playerId: string, powerUp: 'shuffle' | 'wildcard', newBoard: TileData[][] }
  | { type: 'ROUND_END', scores: Record<string, number> }
  | { type: 'GAME_END', finalScores: Record<string, number> }
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "peerjs": "^1.5.0", // WebRTC wrapper
    "nanoid": "^5.0.0"  // Generate room codes
  },
  "devDependencies": {
    // Add word list or dictionary
  }
}
```

---

## Development Order

### Sprint 1: Core Mechanics (1-2 weeks)
1. Word validation
2. Multiplier tiles
3. Gem system
4. Power-ups
5. Round timer
6. Multi-round structure

### Sprint 2: Multiplayer (1-2 weeks)
1. WebRTC setup
2. Invite code system
3. Lobby
4. State synchronization
5. Testing with multiple clients

### Sprint 3: Polish (1 week)
1. UI/UX improvements
2. Animations
3. Sound effects
4. Final testing

---

## Testing Strategy

- [ ] Unit tests for scoring logic
- [ ] Unit tests for word validation
- [ ] Integration tests for state machine
- [ ] Manual multiplayer testing (2-4 players)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile device testing

---

## Notes

### Core Mechanics
- **Turn-based gameplay**: Players take sequential turns, not simultaneous
- **Shared board**: All players interact with the same board; it evolves as tiles get used
- **Tile replacement**: After a word is submitted, used tiles are replaced with new random letters
- **Shuffle behavior**: Rearranges existing letters on the board (does NOT generate new letters)
- **Gems per player**: Each player has their own gem count (max 10)

### Technical
- Use Google STUN servers for NAT traversal: `stun:stun.l.google.com:19302`
- Consider adding TURN server for users behind strict firewalls
- Word list: Use OSPD (Official Scrabble Players Dictionary) or TWL (Tournament Word List)

### Visual Design
- Gem tiles should be visually distinct (sparkle animation?)
- Frozen tiles should pulse or have ice overlay
- Turn indicator should be prominent (highlight active player)
- Show "Waiting for [PlayerName]..." during opponent turns
- Consider adding sound effects (tile click, word submit, gem collect, turn change, round end)
