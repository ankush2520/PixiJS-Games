# Project Architecture Guide

## Overview

This document provides a detailed technical overview of the PixiJS Games Assignment project architecture.

## Table of Contents

1. [Core Architecture](#core-architecture)
2. [Scene Management](#scene-management)
3. [Game Implementations](#game-implementations)
4. [Performance Considerations](#performance-considerations)
5. [Code Conventions](#code-conventions)

---

## Core Architecture

### Application Flow

```
main.ts
  └─> App.start()
       ├─> Initialize PixiJS
       ├─> Create SceneManager
       ├─> Register Scenes
       ├─> Setup Resize Handlers
       └─> Start Game Loop
```

### Key Components

#### 1. App (`src/core/App.ts`)

- **Purpose**: Main application controller
- **Responsibilities**:
  - Initialize PixiJS renderer
  - Setup canvas and DOM
  - Create scene manager
  - Handle window resize
  - Coordinate global UI (FPS counter)

```typescript
app.start() → Scene Manager → Active Scene → Update Loop
```

#### 2. SceneManager (`src/core/SceneManager.ts`)

- **Purpose**: Manages game scenes and transitions
- **Responsibilities**:
  - Add/remove scenes from stage
  - Call scene lifecycle methods
  - Coordinate scene updates
  - Handle scene switching

**Scene Lifecycle:**

```
show(scene) → onEnter() → resize() → update(dt) → onExit()
```

#### 3. BaseScene (`src/core/BaseScene.ts`)

- **Purpose**: Abstract base class for all scenes
- **Interface**:
  - `onEnter()`: Called when scene becomes active
  - `onExit()`: Called when scene is removed
  - `resize(width, height)`: Handle window resize
  - `update(dt)`: Frame update with delta time

---

## Scene Management

### Scene Types

1. **MenuScene** - Main menu with game selection
2. **Game Scenes** - Individual game implementations
   - AceOfShadowsScene
   - MagicWordsScene
   - PhoenixFlameScene

### Navigation Pattern

All game scenes receive a callback to return to the menu:

```typescript
constructor(private readonly onHomeSelected: () => void)
```

This creates a simple navigation graph:

```
Menu ←→ Game 1
     ←→ Game 2
     ←→ Game 3
```

---

## Game Implementations

### 1. Ace of Shadows

**Location**: `src/tasks/ace-of-shadows/`

**Components**:

- **AceOfShadowsBoard**: Main game logic and rendering
- **AceOfShadowUIManager**: UI controls (play, reset, test buttons)
- **AceOfShadowsScene**: Scene coordinator

#### Visual Technique: 3D Card Stacking

**Problem**: Create realistic stacked playing cards effect with 144 cards

**Solution**: Layered sprite positioning with micro-offsets

```typescript
// Each card offset by 0.32px in X and Y
for (let i = 0; i < 144; i++) {
  card.x = i * 0.32; // Total offset: 46px
  card.y = i * 0.32;
}
```

**Result**: 46px of visible "paper thickness" showing individual card layers

#### Card Texture Generation

Cards are dynamically generated using Canvas API:

1. **Main Face**: Pink color (0xf56f76)
2. **Edge Strip**: Random color, 2px wide on top/left
3. **Border**: Semi-transparent black for definition

**Why random edge colors?**

- Creates visual variety in the stack
- Simulates different "paper" thicknesses
- Makes individual card layers distinguishable

#### Performance Optimizations

1. **Texture Caching**: 144 textures generated once and reused
2. **Sprite Reuse**: Only animating cards exist outside stacks
3. **RequestAnimationFrame**: Smooth 60fps animations
4. **Efficient Stacking**: Cards stay in container children, not separate objects

---

### 2. Magic Words

**Location**: `src/tasks/magic-words/`

**Components**:

- **MagicWordsBoard**: Text display and scroll logic
- **RichTextRenderer**: Parses and renders formatted text
- **ScrollingHandler**: Touch/mouse scroll interaction

#### Rich Text Format

Simple inline formatting:

```
*bold*
_italic_
*_bold italic_*
```

**Implementation**:

- Parse text into segments with style flags
- Create PixiJS Text objects per segment
- Position segments horizontally with proper spacing

#### Scroll Mechanics

```typescript
scroll(deltaY) → update position → clamp to bounds → render
```

Supports both mouse wheel and touch drag.

---

### 3. Phoenix Flame

**Location**: `src/tasks/phoenix-flame/`

**Components**:

- **FireEffect**: Particle system manager

#### Particle System

**Life Cycle**:

```
Create → Initialize → Update → Fadeout → Recycle
```

**Properties per particle**:

- Position (x, y)
- Velocity (vx, vy)
- Alpha (fade over lifetime)
- Scale (grow/shrink)
- Lifetime counter

**Optimization**: Object pool to avoid GC pressure

---

## Performance Considerations

### General Best Practices

1. **Minimize Object Creation**
   - Reuse sprites and textures
   - Use object pools for particles
   - Cache computed values

2. **Efficient Rendering**
   - Group sprites in containers
   - Use sprite batching when possible
   - Minimize texture switches

3. **Animation Performance**
   - Use `requestAnimationFrame`
   - Delta time for frame-rate independence
   - Easing functions for smooth motion

4. **Memory Management**
   - Destroy unused resources
   - Clear event listeners
   - Remove children before destroying containers

### Card Animation Specifics

**Challenge**: Animate cards smoothly without lag

**Solution**:

- Only the moving card exists outside its stack
- Use cubic easing: `1 - (1 - t)³`
- 2-second duration prevents stutter
- Track animation frames for cleanup

```typescript
const animate = () => {
  const progress = elapsed / duration;
  const eased = 1 - Math.pow(1 - progress, 3);
  card.x = startX + (targetX - startX) * eased;
  // ...
  requestAnimationFrame(animate);
};
```

---

## Code Conventions

### TypeScript Usage

- **Strict Mode**: Enabled
- **Type Safety**: Explicit types for public APIs
- **Readonly**: Use for immutable properties
- **Private**: Hide implementation details

### Naming Conventions

- **Classes**: PascalCase (`AceOfShadowsBoard`)
- **Methods**: camelCase (`startAnimation`)
- **Constants**: UPPER_SNAKE_CASE (`CARD_WIDTH`)
- **Private fields**: prefixed with `private` keyword

### File Organization

```
Feature/
  ├── FeatureBoard.ts      # Main logic/rendering
  ├── FeatureUIManager.ts  # UI controls
  └── FeatureScene.ts      # Scene coordinator
```

### Comments

Use JSDoc for public APIs:

```typescript
/**
 * Brief description
 *
 * Detailed explanation
 *
 * @param name - Parameter description
 * @returns Return value description
 */
```

Inline comments for complex logic:

```typescript
// WHY this code exists, not WHAT it does
const offset = 0.32; // Creates 46px visible edge with 144 cards
```

---

## Visual Effects Explained

### Why Cards Look "Stacked"

The 3D effect is an optical illusion created by:

1. **Micro-offsets**: 0.32px per card (invisible individually)
2. **Accumulation**: 144 × 0.32px = 46px visible edge
3. **Color variety**: Random colored edges show layers
4. **Shadows/highlights**: Darker borders create depth

### Edge Strip Technique

```
Card 1:  [PINK.............]
           ↓
Card 2:  [PINK.............]
           ↓ ↓
Card 3:  [PINK.............]
           ↓ ↓ ↓
...
```

The offset reveals the 2px colored edge of each card, creating visible "paper thickness".

---

## Responsive Design

### Layout Strategy

**Portrait** (width < height):

- 2 columns × 3 rows
- Smaller cards (0.78 scale)
- Buttons closer to game area

**Landscape** (width > height):

- 3 columns × 2 rows
- Full size cards (1.0 scale)
- More spacing between elements

### Resize Handling

All scenes implement `resize(width, height)`:

1. Calculate available space (minus padding)
2. Determine orientation
3. Recreate layout if orientation changed
4. Reposition all elements

---

## Future Improvements

1. **Card Animations**: Add rotation and flip effects
2. **Sound Effects**: Audio feedback for actions
3. **Save State**: Remember game progress
4. **More Games**: Expand the collection
5. **Multiplayer**: Network play support
6. **Accessibility**: Keyboard navigation, screen reader support

---

## Debugging Tips

1. **FPS Counter**: Click it to see performance metrics
2. **Console Logs**: Scene transitions and errors logged
3. **Browser DevTools**: Use Performance tab to profile
4. **PixiJS Inspector**: Chrome extension for scene hierarchy

---

## References

- [PixiJS Documentation](https://pixijs.com/docs)
- [Canvas API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Easing Functions](https://easings.net/)

---

_Last Updated: March 2, 2026_
