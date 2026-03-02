# PixiJS Games Assignment

A collection of interactive games built with PixiJS v8, demonstrating animation, user interaction, and visual effects.

## 🎮 Features

This project contains three unique games:

### 1. **Ace of Shadows**

A card animation game featuring 144 cards distributed across 6 stacks.

- **Visual Effects**: Realistic 3D card stacking with visible layer separation
- **Animations**: Smooth card movement with easing functions
- **Interactive Controls**: Start animation, reset cards, and quick distribution test

### 2. **Magic Words**

A scrolling text display with rich formatting.

- **Scroll Mechanics**: Smooth vertical scrolling with mouse/touch
- **Rich Text**: Supports bold, italic, and combined formatting
- **Responsive Design**: Adapts to different screen sizes

### 3. **Phoenix Flame**

A particle-based fire effect simulation.

- **Particle System**: Dynamic fire particles with realistic behavior
- **Visual Effects**: Flame movement, alpha fading, and heat distortion
- **Performance**: Optimized particle rendering

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Softgames-Assignment
```

2. Install dependencies:

```bash
npm install
```

3. Start development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 📁 Project Structure

```
Softgames-Assignment/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── core/                   # Core framework classes
│   │   ├── App.ts             # Main application controller
│   │   ├── BaseScene.ts       # Base scene class
│   │   └── SceneManager.ts    # Scene management system
│   ├── scenes/                # Game scenes
│   │   ├── MenuScene.ts       # Main menu
│   │   ├── AceOfShadowsScene.ts
│   │   ├── MagicWordsScene.ts
│   │   └── PhoenixFlameScene.ts
│   ├── tasks/                 # Game implementation
│   │   ├── ace-of-shadows/    # Card animation game
│   │   ├── magic-words/       # Scrolling text game
│   │   └── phoenix-flame/     # Fire effect game
│   ├── ui/                    # Shared UI components
│   │   └── HomeButton.ts
│   └── Common_UI/             # Common utilities
│       └── FpsCounter.ts      # FPS display
├── public/                    # Static assets
│   ├── style.css
│   └── assets/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 🎨 Game Details

### Ace of Shadows

**Concept**: Visual demonstration of card stacking and animation

**Key Features**:

- 144 cards rendered with efficient sprite reuse
- 3D depth effect using layered positioning (0.3px offset per card)
- Realistic card edges with visible layer separation
- Smooth animation with cubic easing
- Round-robin card distribution across 5 target decks

**Controls**:

- ▶️ **Play**: Start automatic card animation (1 card per second)
- ⚡ **Quick Test**: Instantly distribute all cards (for testing)
- ↻ **Reset**: Return all cards to the first stack

**Technical Highlights**:

- Canvas-based card texture generation
- Derived edge colors from card face colors (no hardcoded values)
- White highlights and dark shadows for depth perception
- Micro brightness variation (±3%) prevents color banding
- Responsive layout (2x3 grid in portrait, 3x2 in landscape)

### Magic Words

**Concept**: Scrollable text with rich formatting support

**Key Features**:

- Efficient text rendering with PixiJS Text objects
- Smooth scroll with momentum
- Rich text parsing (bold, italic, combined styles)
- Automatic text wrapping

**Technical Highlights**:

- Custom scroll handler with bounds checking
- Rich text renderer parses inline formatting
- Optimized for touch and mouse input

### Phoenix Flame

**Concept**: Realistic fire particle effect

**Key Features**:

- Dynamic particle generation
- Physics-based particle movement (velocity, gravity)
- Alpha and scale transitions for realistic flames
- Particle recycling for performance

**Technical Highlights**:

- Efficient particle pool system
- Frame-rate independent updates
- Configurable particle properties

## 🛠️ Technologies Used

- **PixiJS v8.8.1**: WebGL-based 2D rendering engine
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **ESLint + Prettier**: Code quality and formatting

## 📐 Architecture

### Core Pattern

The project uses a **Scene-based architecture**:

1. **App**: Main application controller, handles initialization
2. **SceneManager**: Manages scene transitions and lifecycle
3. **BaseScene**: Abstract base class for all scenes
4. **Individual Scenes**: Implement specific game logic

### Scene Lifecycle

```typescript
onEnter()  → resize()  → update(dt)  → onExit()
```

### Responsive Design

- All scenes implement `resize(width, height)` method
- Layout adapts to portrait/landscape orientations
- Dynamic positioning based on available screen space

## 🎯 Development Guidelines

### Adding a New Game

1. Create game logic in `src/tasks/your-game/`
2. Create scene in `src/scenes/YourGameScene.ts`
3. Add menu entry in `MenuScene.ts`
4. Update routing in scene manager

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Performance Tips

- Reuse sprites when possible
- Use object pooling for frequently created/destroyed objects
- Minimize canvas operations
- Use `requestAnimationFrame` for animations
- Cache expensive calculations

## 🐛 Debugging

### FPS Counter

Press the FPS counter in the top-left to toggle display.

### Console Logging

The app logs scene transitions and important events to the console.

## 📝 License

This project is part of an assignment and is for demonstration purposes.

## 👤 Author

Ankush - [GitHub Profile](https://github.com/ankush2520)

## 🙏 Acknowledgments

- Built with [PixiJS](https://pixijs.com/)
- Particle system concepts inspired by various fire effect tutorials
- Card rendering techniques based on paper simulation research
