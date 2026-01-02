# Wibble - Competitive Multiplayer Word Game

A turn-based word game inspired by Discord's Spellcast. Chain letters on a 5x5 grid to form words and compete with friends!

**🎮 Solo mode is fully playable now!** Just run `npm run dev` and select "Play Solo".

---

## ✨ Features

### ✅ Fully Implemented
- **Word Validation** - 1000+ word dictionary
- **Enhanced Tiles** - DL, TL, 2x multipliers, gems, frozen tiles
- **Advanced Scoring** - Multipliers + long word bonus (+10 for 6+ letters)
- **Gem System** - Collect gems (max 10)
- **Power-Ups** - Shuffle (1💎), Wildcard (3💎)
- **Turn Timer** - Configurable with countdown
- **Multi-Round** - 5 rounds with score tracking
- **Main Menu** - Host/Join/Solo options
- **Lobby System** - Player list, ready status
- **WebRTC Infrastructure** - P2P connection framework

### ✅ Newly Completed
- **WebRTC Integration** - Room creation, joining, and P2P connections
- **Turn Management** - Players take turns with board interaction control
- **Real-time State** - Player status and board updates synchronized
- **Connection Handling** - Automatic disconnection detection

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Visit http://localhost:3000 → Click "Play Solo" → Click "Play"

---

## 🎯 How to Play

1. **Chain letters** by clicking and dragging
2. **Submit word** by releasing mouse
3. **Earn points** based on multipliers:
   - DL (blue) = 2x letter score
   - TL (dark blue) = 3x letter score
   - 2x (pink) = 2x word score
4. **Collect gems** (💎) from gem tiles
5. **Use power-ups**:
   - Shuffle (1💎) - Rearrange letters
   - Wildcard (3💎) - Change any tile
6. **Complete 5 rounds** before timer expires
7. **Win** with highest score!

### Rules
- Minimum 2 letters per word
- Frozen tiles (❄️) cannot be used
- 6+ letter words = +10 bonus
- Gems capped at 10 maximum

---

## 🏗️ Project Structure

```
wibble/
├── components/      # React components
├── stores/          # XState state machine
├── utils/           # Game logic, WebRTC, dictionary
├── types/           # TypeScript definitions
├── docs/            # Implementation plan & logs
└── tests/           # Jest tests
```

---

## 🛠️ Tech Stack

- Next.js 13 + TypeScript
- XState (state management)
- Sass/SCSS
- PeerJS (WebRTC)
- Jest (testing)

---

## 📝 Development Log

See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for detailed architecture.

| Phase | Status | Features |
|-------|--------|----------|
| 1 | ✅ Complete | Core mechanics, multipliers, gems, timer |
| 2 | ✅ Complete | WebRTC, lobby system, menu, turn management |
| 3 | ⏳ Planned | Polish, animations, mobile |

---

## 🎮 Original Project

This is a continuation of the original Wibble project. See development logs:

| Day | Post | Instance |
|-----|------|----------|
| 1 | [Wibble: Day 1](https://jrm.dev/posts/wibble-day-1) | [wibble-day-1.vercel.app](https://wibble-day-1.vercel.app) |
| 2 | [Wibble: Day 2](https://jrm.dev/posts/wibble-day-2) | [wibble-day-2.vercel.app](https://wibble-day-1.vercel.app) |
| 3 | [Wibble: Day 3](https://jrm.dev/posts/wibble-day-3) | [wibble-day-3.vercel.app](https://wibble-day-1.vercel.app) |
| 4 | [Wibble: Day 4](https://jrm.dev/posts/wibble-day-4) | [wibble-day-4.vercel.app](https://wibble-day-1.vercel.app) |
| 5 | [Wibble: An Update](https://jrm.dev/posts/wibble-an-update) | [Figma](https://www.figma.com/file/yhgMix4JiP3y6evGrsvtjP/Wibble-Day-5?node-id=40%3A275&t=wRd6yQG6gNTw9UEE-1) |

---

## 📜 License

```
Copyright (c) 2023 Joseph R Miles

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
