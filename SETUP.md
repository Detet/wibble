# Spellcast Clone - Setup Guide

A multiplayer word game based on Discord's Spellcast activity.

## Features

- **Multiplayer Rooms**: Create and join rooms with 2-8 players
- **Guest Login**: Play without registration
- **Shared Board**: All players compete on the same 5x5 grid
- **Real-time Gameplay**: Simultaneous play with live updates
- **Gem System**: Earn gems by making longer words
- **Abilities**:
  - 🔀 Shuffle (1 gem): Rearrange all tiles
  - ✏️ Replace Tile (2 gems): Change any tile to a letter of your choice
- **Timed Matches**: 90-second rounds
- **Live Scoring**: Track all players' scores in real-time

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, SCSS
- **Backend**: Express.js, Socket.io
- **State Management**: Socket.io for real-time sync

## Installation

1. Dependencies are already installed. If needed, run:
   ```bash
   npm install
   ```

## Running the Application

### Option 1: Run Both Server and Client Together
```bash
npm run dev:all
```

### Option 2: Run Separately

Terminal 1 - Backend Server:
```bash
npm run server
```

Terminal 2 - Frontend:
```bash
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

## How to Play

1. **Login**: Enter your name as a guest
2. **Lobby**: Create a new room or join an existing one
3. **Room**: Wait for other players and click "Ready"
4. **Game**:
   - Drag across tiles to form words
   - Release to submit the word
   - Earn points based on letter values
   - Use gems to activate special abilities
5. **Winner**: Player with highest score when time runs out wins!

## Game Rules

- Words must be at least 2 letters long
- Chain tiles by dragging (tiles must be adjacent horizontally, vertically, or diagonally)
- Used tiles are replaced with new random letters
- Earn 1 gem for words with 5+ letters
- Everyone starts with 3 gems

## Development

- Backend server runs on port 3001
- Frontend runs on port 3000
- Real-time communication via Socket.io
- TypeScript for type safety across client and server
