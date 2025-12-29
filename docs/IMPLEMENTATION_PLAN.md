# Wibble Implementation Plan - Competitive Multiplayer Spellcast Clone

## Game Structure

### Competitive Multiplayer Format
- **Game**: Consists of multiple rounds (5, 10, 15, etc. - selectable)
- **Round**: 1 minute timer (adjustable: 30s, 1m, 2m, 3m)
- **Gameplay**: All players see identical board, compete simultaneously
- **Scoring**: Points accumulate across all rounds
- **Winner**: Highest total score after all rounds

### Round Flow
1. Round starts with 5x5 board (same for all players)
2. Timer counts down (1 minute default)
3. Players form words, earn points/gems
4. Timer expires → Round ends
5. Scores displayed, next round begins with new board
6. After final round → Winner declared

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
- [ ] **Shuffle** (1 gem): Shuffle all tiles on board
- [ ] **Wildcard** (3 gems): Click tile → choose any letter
- [ ] Add power-up buttons to UI
- [ ] Disable buttons when insufficient gems
- [ ] Update state machine with power-up actions

### 1.6 Round Timer System
**Priority: HIGH**
- [ ] Add round timer to game state
- [ ] Countdown display (1:00, 0:59, 0:58...)
- [ ] Auto-end round when timer reaches 0:00
- [ ] Configurable timer duration (30s, 1m, 2m, 3m)

### 1.7 Multi-Round Structure
**Priority: HIGH**
- [ ] Add game configuration:
  - `totalRounds: number` (5, 10, 15, etc.)
  - `roundDuration: number` (30, 60, 120, 180 seconds)
- [ ] Track current round number
- [ ] Generate new board each round
- [ ] Accumulate scores across rounds
- [ ] Display round-by-round scores
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
- [ ] Host is authoritative (generates boards, controls timer)
- [ ] Broadcast game state to all peers:
  - Current board
  - Round number
  - Timer remaining
  - All player scores
- [ ] Each player submits words to host
- [ ] Host validates and broadcasts score updates
- [ ] Handle player disconnections gracefully

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
- [ ] Live opponent score updates during round
- [ ] Player word submissions visible to others (optional)
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
│   │   ├── idle
│   │   ├── chaining
│   │   └── wordSubmitted
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
  roundDuration: number // seconds
}

interface GameState {
  config: GameConfig
  currentRound: number
  timeRemaining: number
  board: TileData[][]
  players: PlayerData[]
  gems: number // local player gems
  currentChain: [number, number][]
  currentWord: string
  currentScore: number
}

interface PlayerData {
  id: string
  name: string
  totalScore: number
  roundScores: number[]
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
  | { type: 'TIMER_UPDATE', timeRemaining: number }
  | { type: 'WORD_SUBMITTED', playerId: string, word: string, score: number }
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

- Use Google STUN servers for NAT traversal: `stun:stun.l.google.com:19302`
- Consider adding TURN server for users behind strict firewalls
- Word list: Use OSPD (Official Scrabble Players Dictionary) or TWL (Tournament Word List)
- Gem tiles should be visually distinct (sparkle animation?)
- Frozen tiles should pulse or have ice overlay
- Consider adding sound effects (tile click, word submit, gem collect, round end)
