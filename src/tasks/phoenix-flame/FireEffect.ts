import { Container, Sprite, Texture } from "pixi.js";

/**
 * Flame Particle State
 * Represents a single flame particle with physics and visual properties
 */
interface FlameState {
  sprite: Sprite; // Visual representation
  vx: number; // Horizontal velocity (pixels/second)
  vy: number; // Vertical velocity (pixels/second, negative = upward)
  age: number; // Current age in seconds
  lifetime: number; // Total lifetime in seconds
  baseScaleX: number; // Initial horizontal scale
  baseScaleY: number; // Initial vertical scale
  baseAlpha: number; // Base opacity (0-1)
  wobblePhase: number; // Phase offset for horizontal wobble animation
  wobbleFreq: number; // Frequency of wobble oscillation
  wobbleAmp: number; // Amplitude of wobble movement
  spin: number; // Rotation speed (radians/second)
  coreHeat: number; // Heat intensity (0=cool, 1=hot) affects color and behavior
  turbPhase: number; // Phase offset for turbulence
  turbFreq: number; // Frequency of turbulent motion
  flickerPhase: number; // Phase offset for opacity flicker
  flickerFreq: number; // Frequency of flicker
  outwardDrift: number; // Outward expansion drift speed
  lift: number; // Upward acceleration (buoyancy)
  active: boolean; // Whether particle is currently alive
}

/**
 * Smoke Particle State
 * Represents a single smoke particle with physics and visual properties
 */
interface SmokeState {
  sprite: Sprite; // Visual representation
  vx: number; // Horizontal velocity (pixels/second)
  vy: number; // Vertical velocity (pixels/second, negative = upward)
  age: number; // Current age in seconds
  lifetime: number; // Total lifetime in seconds
  baseScaleX: number; // Initial horizontal scale
  baseScaleY: number; // Initial vertical scale
  baseAlpha: number; // Base opacity (0-1)
  driftPhase: number; // Phase offset for drift oscillation
  driftFreq: number; // Frequency of drift oscillation
  driftAmp: number; // Amplitude of drift movement
  spin: number; // Rotation speed (radians/second)
  active: boolean; // Whether particle is currently alive
}

/**
 * Realistic Fire and Smoke Particle System
 *
 * Creates a dynamic fire effect with realistic flame and smoke particles.
 *
 * Features:
 * - Object pooling for performance (pre-allocated particle arrays)
 * - Physics-based motion: buoyancy, turbulence, wobble, drift
 * - Dynamic color transitions: white-hot → yellow → orange → red → ember
 * - Additive blending for flames (glowing effect)
 * - Procedurally generated flame and smoke textures
 * - Breathing/pulsing intensity variation
 * - Independent flame and smoke layers for proper rendering order
 *
 * Performance:
 * - Max 10 flames + 10 smoke particles simultaneously
 * - Particle recycling via object pool (no garbage collection)
 * - Spawn rate: ~52 flames/sec, ~8 smoke/sec (modulated by intensity)
 *
 * Visual Behavior:
 * - Flames: Rise with buoyancy, wobble side-to-side, expand and fade
 * - Smoke: Rises slower, drifts horizontally, expands significantly
 * - Heat variation: Hot flames rise faster and stay tighter
 */
export class FireEffect extends Container {
  /** Maximum number of flame particles in the pool */
  private static readonly MAX_FLAMES = 10;

  /** Maximum number of smoke particles in the pool */
  private static readonly MAX_SMOKE = 10;

  /** Base flame spawn rate (particles per second) */
  private static readonly FLAME_SPAWN_RATE = 52;

  /** Base smoke spawn rate (particles per second) */
  private static readonly SMOKE_SPAWN_RATE = 8;

  /** Global scale factor for vertical rise speeds (tune fire height) */
  private static readonly RISE_SCALE = 0.82;

  /** Pool of flame particles (recycled) */
  private readonly flames: FlameState[] = [];

  /** Pool of smoke particles (recycled) */
  private readonly smokes: SmokeState[] = [];

  /** Container for flame sprites (rendered on top) */
  private readonly flameLayer: Container;

  /** Container for smoke sprites (rendered behind flames) */
  private readonly smokeLayer: Container;

  /** Procedurally generated flame texture */
  private flameTexture: Texture | null = null;

  /** Procedurally generated smoke texture */
  private smokeTexture: Texture | null = null;

  /** Horizontal spawn position (center of fire) */
  private spawnX = 0;

  /** Vertical spawn position (base of fire) */
  private spawnY = 0;

  /** Total elapsed time for emitter (used for breathing/pulsing) */
  private emitterTime = 0;

  /** Accumulated fractional flame spawns (spawns when >= 1) */
  private flameSpawnAccum = 0;

  /** Accumulated fractional smoke spawns (spawns when >= 1) */
  private smokeSpawnAccum = 0;

  /**
   * Constructs the fire effect
   * Sets up layering: smoke behind, flames in front
   */
  constructor() {
    super();
    this.smokeLayer = new Container();
    this.flameLayer = new Container();
    // Add smoke first (back layer), then flames (front layer)
    this.addChild(this.smokeLayer, this.flameLayer);
  }

  /**
   * Initializes the particle system
   * Generates textures and pre-allocates particle pools
   * Call this once before first use
   */
  init(): void {
    // Generate textures if not already created
    if (!this.flameTexture) {
      this.flameTexture = this.generateFlameTexture();
    }
    if (!this.smokeTexture) {
      this.smokeTexture = this.generateSmokeTexture();
    }

    // Reset state
    this.flames.length = 0;
    this.smokes.length = 0;
    this.flameSpawnAccum = 0;
    this.smokeSpawnAccum = 0;
    this.emitterTime = 0;
    this.flameLayer.removeChildren();
    this.smokeLayer.removeChildren();

    // Pre-allocate flame particle pool
    for (let i = 0; i < FireEffect.MAX_FLAMES; i++) {
      const sprite = new Sprite(this.flameTexture);
      sprite.anchor.set(0.5); // Center anchor for rotation
      sprite.alpha = 0; // Start invisible
      sprite.blendMode = "add"; // Additive blending for glow effect
      this.flameLayer.addChild(sprite);
      this.flames.push({
        sprite,
        vx: 0,
        vy: 0,
        age: 0,
        lifetime: 1,
        baseScaleX: 1,
        baseScaleY: 1,
        baseAlpha: 0,
        wobblePhase: 0,
        wobbleFreq: 0,
        wobbleAmp: 0,
        spin: 0,
        coreHeat: 0,
        turbPhase: 0,
        turbFreq: 0,
        flickerPhase: 0,
        flickerFreq: 0,
        outwardDrift: 0,
        lift: 0,
        active: false,
      });
    }

    // Pre-allocate smoke particle pool
    for (let i = 0; i < FireEffect.MAX_SMOKE; i++) {
      const sprite = new Sprite(this.smokeTexture);
      sprite.anchor.set(0.5); // Center anchor for rotation
      sprite.alpha = 0; // Start invisible
      this.smokeLayer.addChild(sprite);
      this.smokes.push({
        sprite,
        vx: 0,
        vy: 0,
        age: 0,
        lifetime: 1,
        baseScaleX: 1,
        baseScaleY: 1,
        baseAlpha: 0,
        driftPhase: 0,
        driftFreq: 0,
        driftAmp: 0,
        spin: 0,
        active: false,
      });
    }
  }

  /**
   * Updates spawn position based on viewport size
   * Centers fire horizontally at middle vertical position
   *
   * @param width - Viewport width
   * @param height - Viewport height
   */
  resize(width: number, height: number): void {
    this.spawnX = Math.round(width * 0.5); // Center horizontally
    this.spawnY = height * 0.5; // Middle vertically
  }

  /**
   * Updates the fire effect (call every frame)
   *
   * Handles:
   * - Intensity modulation (breathing, flutter, random bursts)
   * - Particle spawning based on spawn rates
   * - Physics updates for all active particles
   *
   * @param delta - Time multiplier (typically 1 at 60fps)
   */
  update(delta: number): void {
    const dt = delta / 60; // Normalize to 60fps base
    this.emitterTime += dt;

    // Dynamic intensity modulation for realistic fire behavior
    // Breath: Slow pulsing (like breathing)
    const breath = 0.74 + 0.34 * (0.5 + 0.5 * Math.sin(this.emitterTime * 2.7));
    // Flutter: Fast oscillation (like flickering)
    const flutter =
      0.88 + 0.18 * (0.5 + 0.5 * Math.sin(this.emitterTime * 9.3));
    // Burst: Random intensity spikes
    const burst = Math.random() < dt * 0.9 ? 1.25 : 1;
    const intensity = breath * flutter * burst;

    // Accumulate fractional spawns (spawn when accumulator >= 1)
    this.flameSpawnAccum += dt * FireEffect.FLAME_SPAWN_RATE * intensity;
    this.smokeSpawnAccum +=
      dt *
      FireEffect.SMOKE_SPAWN_RATE *
      (0.72 + 0.34 * breath) * // Modulate by breath
      (0.95 + 0.08 * Math.random()); // Add randomness

    // Spawn and update particles
    this.spawnFlames(intensity);
    this.spawnSmoke(intensity);
    this.updateFlames(dt);
    this.updateSmoke(dt);
  }

  /**
   * Cleans up resources
   * @param options - Destruction options passed to parent
   */
  destroy(options?: boolean): void {
    this.flames.length = 0;
    this.smokes.length = 0;
    super.destroy(options);
  }

  /**
   * Spawns flame particles based on accumulated spawn count
   * Creates flames in a ring pattern with sway and jitter
   *
   * @param intensity - Current fire intensity multiplier
   */
  private spawnFlames(intensity: number): void {
    // Spawn one flame per accumulated unit
    while (this.flameSpawnAccum >= 1) {
      this.flameSpawnAccum -= 1;
      // Find inactive particle slot (object pool recycling)
      const slot = this.flames.find((f) => !f.active);
      if (!slot) break; // Pool exhausted

      // Position flames in a ring around spawn point
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * (12 + intensity * 12);
      const ringX = Math.cos(angle) * radius * 1.6; // Wider horizontally
      const ringY = -Math.abs(Math.sin(angle) * radius * 0.32); // Narrow vertically

      // Add swaying motion based on emitter time
      const sway =
        Math.sin(this.emitterTime * 1.25) * (6 + intensity * 5) +
        Math.sin(this.emitterTime * 4.6) * 2.5;
      const yJitter = Math.random() * 12 - 10;

      this.resetFlame(
        slot,
        this.spawnX + sway + ringX,
        this.spawnY + ringY + yJitter,
      );
    }
  }

  /**
   * Spawns smoke particles based on accumulated spawn count
   * Creates smoke with wider spread than flames
   *
   * @param intensity - Current fire intensity multiplier
   */
  private spawnSmoke(intensity: number): void {
    while (this.smokeSpawnAccum >= 1) {
      this.smokeSpawnAccum -= 1;
      // Randomly skip some smoke spawns for variety
      if (Math.random() < 0.32) continue;

      // Find inactive particle slot
      const slot = this.smokes.find((s) => !s.active);
      if (!slot) break; // Pool exhausted

      // Position with sway and wide horizontal variation
      const sway = Math.sin(this.emitterTime * 1.1) * (4 + intensity * 4);
      const xJitter = (Math.random() - 0.5) * (46 + intensity * 30); // Wide spread
      const yJitter = Math.random() * 8 - 14;

      this.resetSmoke(
        slot,
        this.spawnX + sway + xJitter,
        this.spawnY + yJitter,
      );
    }
  }

  /**
   * Initializes a flame particle with randomized properties
   *
   * Heat-based variation:
   * - Hot flames: Rise faster, narrower, brighter, white-yellow color
   * - Cool flames: Drift more, wider, dimmer, more orange-red
   *
   * @param p - Flame particle to initialize
   * @param x - Spawn X position
   * @param y - Spawn Y position
   */
  private resetFlame(p: FlameState, x: number, y: number): void {
    p.active = true;
    p.age = 0;
    p.sprite.x = x;
    p.sprite.y = y;
    p.sprite.tint = 0xffffea; // Initial yellowish-white tint  // Initial yellowish-white tint

    // Heat determines behavior: 0=cool/orange, 1=hot/white
    p.coreHeat = this.rand(0, 1);
    const base = this.rand(0.76, 1.42);
    const widthBias = 0.74 + (1 - p.coreHeat) * 0.42; // Cooler = wider
    const heightBias = 1.2 + p.coreHeat * 0.95; // Hotter = taller
    p.baseScaleX = base * this.rand(0.72, 1.08) * widthBias;
    p.baseScaleY = base * this.rand(1.02, 1.75) * heightBias * 0.88;
    p.baseAlpha = this.rand(0.52, 0.86) + p.coreHeat * 0.14; // Hotter = brighter  // Hotter = brighter

    // Physics properties vary with heat
    const lateralDrift = 16 - p.coreHeat * 8; // Hot flames drift less
    p.vx = this.rand(-lateralDrift, lateralDrift);
    // Hot flames rise faster (more negative vy)
    p.vy =
      -this.rand(128 + p.coreHeat * 32, 215 + p.coreHeat * 52) *
      FireEffect.RISE_SCALE;
    p.outwardDrift = this.rand(-16, 16) * (0.5 + (1 - p.coreHeat) * 0.44); // Cool flames expand more
    p.lifetime = this.rand(0.78, 1.45) - p.coreHeat * 0.12; // Hot flames live slightly shorter
    p.lift = (this.rand(58, 100) + p.coreHeat * 22) * FireEffect.RISE_SCALE; // Buoyancy acceleration  // Buoyancy acceleration

    // Randomize oscillation parameters for variety
    p.wobblePhase = this.rand(0, Math.PI * 2); // Random start phase
    p.wobbleFreq = this.rand(3.8, 7.1); // Wobble speed
    p.wobbleAmp = this.rand(12, 28) * (0.7 + (1 - p.coreHeat) * 0.45); // Cool flames wobble more
    p.spin = this.rand(-0.44, 0.44); // Rotation speed
    p.flickerPhase = this.rand(0, Math.PI * 2); // Flicker start phase
    p.flickerFreq = this.rand(11, 23); // Flicker speed
    p.turbPhase = this.rand(0, Math.PI * 2); // Turbulence start phase
    p.turbFreq = this.rand(7, 13); // Turbulence speed               // Turbulence speed

    // Initialize visual properties
    p.sprite.scale.set(p.baseScaleX, p.baseScaleY);
    p.sprite.rotation = this.rand(-0.05, 0.05); // Slight initial rotation
    p.sprite.alpha = 0; // Start invisible, will fade in
  }

  /**
   * Initializes a smoke particle with randomized properties
   * Smoke has longer lifetime and more drift than flames
   *
   * @param p - Smoke particle to initialize
   * @param x - Spawn X position
   * @param y - Spawn Y position
   */
  private resetSmoke(p: SmokeState, x: number, y: number): void {
    p.active = true;
    p.age = 0;
    p.sprite.x = x;
    p.sprite.y = y;
    p.sprite.tint = 0x5e554d; // Brownish-gray smoke color  // Brownish-gray smoke color

    // Randomize scale (smoke particles are larger than flames)
    const base = this.rand(0.74, 1.22);
    p.baseScaleX = base * this.rand(0.85, 1.3);
    p.baseScaleY = base * this.rand(0.9, 1.36);
    p.baseAlpha = this.rand(0.16, 0.34); // Semi-transparent

    // Physics: slower rise and wider drift than flames
    p.vx = this.rand(-22, 22); // Horizontal velocity
    p.vy = -this.rand(36, 82); // Vertical velocity (slower than flames)
    p.lifetime = this.rand(1.25, 2.5); // Lives longer than flames

    // Randomize drift oscillation
    p.driftPhase = this.rand(0, Math.PI * 2); // Random start phase
    p.driftFreq = this.rand(1.4, 2.9); // Drift frequency (slower than flame wobble)
    p.driftAmp = this.rand(10, 24); // Drift amplitude
    p.spin = this.rand(-0.25, 0.25); // Rotation speed

    // Initialize visual properties
    p.sprite.scale.set(p.baseScaleX, p.baseScaleY);
    p.sprite.rotation = this.rand(-0.2, 0.2); // Initial rotation
    p.sprite.alpha = 0; // Start invisible
  }

  /**
   * Updates all active flame particles
   * Handles physics, visual effects, and lifecycle
   *
   * @param dt - Delta time (seconds)
   */
  private updateFlames(dt: number): void {
    for (const p of this.flames) {
      if (!p.active) continue;

      // Age the particle
      p.age += dt;
      const progress = Math.min(1, p.age / p.lifetime); // 0 to 1
      const remaining = 1 - progress;

      // Deactivate when lifetime exceeded
      if (p.age >= p.lifetime) {
        p.active = false;
        p.sprite.alpha = 0;
        continue;
      }

      // Fade in quickly at start, fade out gradually at end
      const fadeIn = Math.min(1, progress / 0.08); // Fade in over first 8% of life
      const fadeOut = Math.pow(remaining, 0.86); // Gradual fade out

      // Physics: buoyancy increases over time (hot air rises faster)
      const buoyancy = p.lift * (0.72 + progress * 0.58);
      p.vy -= buoyancy * dt; // Accelerate upward
      p.vx *= Math.max(0, 1 - 2.8 * dt); // Dampen horizontal velocity

      // Calculate motion modifiers
      const wobble =
        Math.sin(p.age * p.wobbleFreq + p.wobblePhase) *
        p.wobbleAmp *
        (0.28 + progress * 0.58); // Wobble increases over time
      const turbulence =
        Math.sin(p.age * p.turbFreq + p.turbPhase) *
        (7 + p.coreHeat * 4) * // Hotter flames more turbulent
        (0.24 + progress * 0.52); // Turbulence increases over time
      const spread = p.outwardDrift * (0.16 + progress * 0.58); // Expand outward
      const flickerAmp = 0.1 + (1 - p.coreHeat) * 0.07; // Cool flames flicker more
      const flicker = Math.max(
        0.68,
        0.9 + flickerAmp * Math.sin(p.age * p.flickerFreq + p.flickerPhase),
      );

      // Apply all motion components
      p.sprite.x += (p.vx + wobble + turbulence + spread) * dt;
      p.sprite.y += p.vy * dt;
      // Calculate final alpha with all modifiers
      p.sprite.alpha =
        p.baseAlpha * fadeIn * fadeOut * flicker * (0.92 + p.coreHeat * 0.12);

      // Scale changes: grow wider, shrink in height over time
      const widthGrowth = 0.72 + 0.62 * progress + (1 - p.coreHeat) * 0.12; // Expand
      const heightDecay = 1.34 - 0.42 * progress + p.coreHeat * 0.08; // Shrink vertically
      p.sprite.scale.x = p.baseScaleX * widthGrowth;
      p.sprite.scale.y = p.baseScaleY * Math.max(0.38, heightDecay);

      // Apply rotation
      p.sprite.rotation += p.spin * dt;
      // Update color based on age and heat
      p.sprite.tint = this.flameTint(progress, p.coreHeat);
    }
  }

  /**
   * Updates all active smoke particles
   * Smoke rises slower and expands more than flames
   *
   * @param dt - Delta time (seconds)
   */
  private updateSmoke(dt: number): void {
    for (const p of this.smokes) {
      if (!p.active) continue;

      // Age the particle
      p.age += dt;
      const progress = Math.min(1, p.age / p.lifetime); // 0 to 1
      const remaining = 1 - progress;

      // Deactivate when lifetime exceeded
      if (p.age >= p.lifetime) {
        p.active = false;
        p.sprite.alpha = 0;
        continue;
      }

      // Fade in slower than flames, fade out even more gradually
      const fadeIn = Math.min(1, progress / 0.22); // Fade in over first 22% of life
      const fadeOut = Math.pow(remaining, 1.28); // Very gradual fade out

      // Physics: constant upward acceleration (buoyancy)
      p.vy -= 18 * dt; // Slower rise than flames
      p.vx *= Math.max(0, 1 - 1.6 * dt); // Dampen horizontal velocity
      // Sinusoidal drift (gentle side-to-side motion)
      const drift =
        Math.sin(p.age * p.driftFreq + p.driftPhase) *
        p.driftAmp *
        (0.42 + remaining * 0.58); // Drift decreases over time

      // Apply motion
      p.sprite.x += (p.vx + drift) * dt;
      p.sprite.y += p.vy * dt;
      p.sprite.alpha = p.baseAlpha * fadeIn * fadeOut;

      // Smoke expands significantly over lifetime
      p.sprite.scale.x = p.baseScaleX * (1 + 0.9 * progress); // Grow ~90%
      p.sprite.scale.y = p.baseScaleY * (1 + 1.06 * progress); // Grow ~106%

      // Apply rotation
      p.sprite.rotation += p.spin * dt;
      // Update color (darkens over time)
      p.sprite.tint = this.smokeTint(progress);
    }
  }

  /**
   * Calculates flame color based on age and heat
   *
   * Color progression:
   * - Start: White-hot core (young flame)
   * - 16%: Warm yellow-white
   * - 52%: Orange
   * - 82%: Red
   * - End: Dark ember
   *
   * @param progress - Age progress (0 to 1)
   * @param coreHeat - Heat intensity (0=cool, 1=hot)
   * @returns RGB color value
   */
  private flameTint(progress: number, coreHeat: number): number {
    const t = 1 - coreHeat; // Invert for color interpolation
    // Define color stops based on heat (hot flames whiter, cool flames more orange)
    const hotCore = this.lerpColor(0xfffff0, 0xfff4c4, t); // White to cream
    const warmMid = this.lerpColor(0xfff6c2, 0xffd27a, t); // Cream to light orange
    const orange = this.lerpColor(0xffd27a, 0xff8a24, t); // Light to deep orange
    const red = this.lerpColor(0xff8a24, 0xc81912, t); // Orange to red
    const ember = this.lerpColor(0x4b0506, 0x1e0102, coreHeat * 0.6); // Dark red to black  // Dark red to black

    // Interpolate between color stops based on age progress
    if (progress < 0.16) {
      return this.lerpColor(hotCore, warmMid, progress / 0.16); // 0-16%: Hot core phase
    }
    if (progress < 0.52) {
      return this.lerpColor(warmMid, orange, (progress - 0.16) / 0.36); // 16-52%: Warm phase
    }
    if (progress < 0.82) {
      return this.lerpColor(orange, red, (progress - 0.52) / 0.3); // 52-82%: Orange to red
    }
    return this.lerpColor(red, ember, (progress - 0.82) / 0.18); // 82-100%: Dying ember
  }

  /**
   * Calculates smoke color based on age
   * Smoke darkens from brownish-gray to nearly black
   *
   * @param progress - Age progress (0 to 1)
   * @returns RGB color value
   */
  private smokeTint(progress: number): number {
    if (progress < 0.58) {
      // 0-58%: Light brownish-gray to medium gray
      return this.lerpColor(0x61574f, 0x4b423b, progress / 0.58);
    }
    // 58-100%: Medium gray to nearly black
    return this.lerpColor(0x4b423b, 0x191615, (progress - 0.58) / 0.42);
  }

  /**
   * Linearly interpolates between two RGB colors
   *
   * @param from - Starting color (0xRRGGBB)
   * @param to - Ending color (0xRRGGBB)
   * @param t - Interpolation factor (0 to 1)
   * @returns Interpolated color
   */
  private lerpColor(from: number, to: number, t: number): number {
    const f = Math.max(0, Math.min(1, t)); // Clamp to [0, 1]
    // Extract and interpolate each color channel
    const r = Math.round(
      ((from >> 16) & 0xff) + (((to >> 16) & 0xff) - ((from >> 16) & 0xff)) * f,
    );
    const g = Math.round(
      ((from >> 8) & 0xff) + (((to >> 8) & 0xff) - ((from >> 8) & 0xff)) * f,
    );
    const b = Math.round((from & 0xff) + ((to & 0xff) - (from & 0xff)) * f);
    // Recombine channels
    return (r << 16) | (g << 8) | b;
  }

  /**
   * Returns random number in range [min, max)
   */
  private rand(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  /**
   * Generates procedural flame texture using Canvas API
   *
   * Renders multiple gradient layers:
   * 1. Outer glow (radial gradient for soft edges)
   * 2. Body shape (linear gradient with teardrop shape)
   * 3. Core (bright center with radial gradient)
   * 4. Base glow (elliptical glow at bottom)
   *
   * @returns Generated texture
   */
  private generateFlameTexture(): Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 192;
    const ctx = canvas.getContext("2d");
    if (!ctx) return Texture.WHITE;

    // Layer 1: Outer glow (soft diffuse edge)
    const outerGlow = ctx.createRadialGradient(96, 118, 14, 96, 118, 92);
    outerGlow.addColorStop(0, "rgba(255, 194, 112, 0.86)"); // Orange center
    outerGlow.addColorStop(0.4, "rgba(255, 124, 40, 0.54)"); // Orange-red mid
    outerGlow.addColorStop(0.72, "rgba(178, 26, 12, 0.28)"); // Red outer
    outerGlow.addColorStop(1, "rgba(42, 2, 4, 0)"); // Fade to transparent
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(96, 118, 92, 0, Math.PI * 2);
    ctx.fill();

    // Layer 2: Main body shape (teardrop/flame shape)
    const body = ctx.createLinearGradient(96, 18, 96, 186);
    body.addColorStop(0, "rgba(255, 236, 170, 0)"); // Transparent tip
    body.addColorStop(0.2, "rgba(255, 216, 132, 0.2)"); // Light yellow
    body.addColorStop(0.5, "rgba(255, 156, 50, 0.54)"); // Orange mid
    body.addColorStop(0.82, "rgba(210, 42, 16, 0.34)"); // Red lower
    body.addColorStop(1, "rgba(60, 3, 5, 0)"); // Fade at base
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(96, 18); // Top point
    ctx.bezierCurveTo(146, 62, 154, 128, 96, 178); // Right curve
    ctx.bezierCurveTo(38, 128, 46, 62, 96, 18); // Left curve back to top
    ctx.closePath();
    ctx.fill();

    // Layer 3: Bright core (hottest part)
    const core = ctx.createRadialGradient(96, 110, 6, 96, 110, 44);
    core.addColorStop(0, "rgba(255, 255, 244, 0.96)"); // Nearly white center
    core.addColorStop(0.34, "rgba(255, 236, 168, 0.9)"); // Pale yellow
    core.addColorStop(0.66, "rgba(255, 146, 36, 0.56)"); // Orange
    core.addColorStop(1, "rgba(196, 28, 14, 0)"); // Fade to transparent
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.moveTo(96, 42); // Top
    ctx.bezierCurveTo(126, 78, 130, 124, 96, 160); // Right curve
    ctx.bezierCurveTo(62, 124, 66, 78, 96, 42); // Left curve
    ctx.closePath();
    ctx.fill();

    // Layer 4: Base glow (where flame meets fuel source)
    const baseGlow = ctx.createRadialGradient(96, 152, 6, 96, 152, 48);
    baseGlow.addColorStop(0, "rgba(255, 204, 120, 0.5)"); // Yellow-orange center
    baseGlow.addColorStop(0.54, "rgba(255, 96, 24, 0.24)"); // Orange mid
    baseGlow.addColorStop(1, "rgba(76, 6, 8, 0)"); // Dark fade
    ctx.fillStyle = baseGlow;
    ctx.beginPath();
    ctx.ellipse(96, 152, 62, 20, 0, 0, Math.PI * 2); // Ellipse (wide, flat)
    ctx.fill();

    return Texture.from(canvas);
  }

  /**
   * Generates procedural smoke texture using Canvas API
   *
   * Renders two gradient layers:
   * 1. Body (radial puff of smoke)
   * 2. Plume (vertical elongated wisp)
   *
   * @returns Generated texture
   */
  private generateSmokeTexture(): Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    if (!ctx) return Texture.WHITE;

    // Layer 1: Main body (soft puff)
    const body = ctx.createRadialGradient(80, 88, 8, 80, 88, 66);
    body.addColorStop(0, "rgba(118, 109, 102, 0.36)"); // Light gray center
    body.addColorStop(0.45, "rgba(74, 68, 64, 0.26)"); // Medium gray
    body.addColorStop(1, "rgba(20, 18, 18, 0)"); // Fade to transparent
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(80, 88, 66, 0, Math.PI * 2);
    ctx.fill();

    // Layer 2: Vertical plume (elongated wisp)
    const plume = ctx.createLinearGradient(80, 18, 80, 152);
    plume.addColorStop(0, "rgba(124, 116, 108, 0)"); // Transparent top
    plume.addColorStop(0.28, "rgba(102, 95, 88, 0.2)"); // Light gray
    plume.addColorStop(0.68, "rgba(70, 64, 60, 0.26)"); // Medium gray
    plume.addColorStop(1, "rgba(23, 21, 20, 0)"); // Fade at bottom
    ctx.fillStyle = plume;
    ctx.beginPath();
    ctx.ellipse(80, 86, 40, 56, 0, 0, Math.PI * 2); // Vertical ellipse
    ctx.fill();

    return Texture.from(canvas);
  }
}
