import { Container, Sprite, Texture } from "pixi.js";

interface FlameState {
  sprite: Sprite;
  vx: number;
  vy: number;
  age: number;
  lifetime: number;
  baseScaleX: number;
  baseScaleY: number;
  baseAlpha: number;
  wobblePhase: number;
  wobbleFreq: number;
  wobbleAmp: number;
  spin: number;
  coreHeat: number;
  turbPhase: number;
  turbFreq: number;
  flickerPhase: number;
  flickerFreq: number;
  outwardDrift: number;
  lift: number;
  active: boolean;
}

interface SmokeState {
  sprite: Sprite;
  vx: number;
  vy: number;
  age: number;
  lifetime: number;
  baseScaleX: number;
  baseScaleY: number;
  baseAlpha: number;
  driftPhase: number;
  driftFreq: number;
  driftAmp: number;
  spin: number;
  active: boolean;
}

export class FireEffect extends Container {
  private static readonly MAX_FLAMES = 10;
  private static readonly MAX_SMOKE = 10;
  private static readonly FLAME_SPAWN_RATE = 52;
  private static readonly SMOKE_SPAWN_RATE = 8;
  private static readonly RISE_SCALE = 0.82;

  private readonly flames: FlameState[] = [];
  private readonly smokes: SmokeState[] = [];
  private readonly flameLayer: Container;
  private readonly smokeLayer: Container;

  private flameTexture: Texture | null = null;
  private smokeTexture: Texture | null = null;

  private spawnX = 0;
  private spawnY = 0;
  private emitterTime = 0;
  private flameSpawnAccum = 0;
  private smokeSpawnAccum = 0;

  constructor() {
    super();
    this.smokeLayer = new Container();
    this.flameLayer = new Container();
    this.addChild(this.smokeLayer, this.flameLayer);
  }

  init(): void {
    if (!this.flameTexture) {
      this.flameTexture = this.generateFlameTexture();
    }
    if (!this.smokeTexture) {
      this.smokeTexture = this.generateSmokeTexture();
    }

    this.flames.length = 0;
    this.smokes.length = 0;
    this.flameSpawnAccum = 0;
    this.smokeSpawnAccum = 0;
    this.emitterTime = 0;
    this.flameLayer.removeChildren();
    this.smokeLayer.removeChildren();

    for (let i = 0; i < FireEffect.MAX_FLAMES; i++) {
      const sprite = new Sprite(this.flameTexture);
      sprite.anchor.set(0.5);
      sprite.alpha = 0;
      sprite.blendMode = "add";
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

    for (let i = 0; i < FireEffect.MAX_SMOKE; i++) {
      const sprite = new Sprite(this.smokeTexture);
      sprite.anchor.set(0.5);
      sprite.alpha = 0;
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

  resize(width: number, height: number): void {
    this.spawnX = Math.round(width * 0.5);
    this.spawnY = height * 0.5;
  }

  update(delta: number): void {
    const dt = delta / 60;
    this.emitterTime += dt;

    const breath = 0.74 + 0.34 * (0.5 + 0.5 * Math.sin(this.emitterTime * 2.7));
    const flutter =
      0.88 + 0.18 * (0.5 + 0.5 * Math.sin(this.emitterTime * 9.3));
    const burst = Math.random() < dt * 0.9 ? 1.25 : 1;
    const intensity = breath * flutter * burst;

    this.flameSpawnAccum += dt * FireEffect.FLAME_SPAWN_RATE * intensity;
    this.smokeSpawnAccum +=
      dt *
      FireEffect.SMOKE_SPAWN_RATE *
      (0.72 + 0.34 * breath) *
      (0.95 + 0.08 * Math.random());

    this.spawnFlames(intensity);
    this.spawnSmoke(intensity);
    this.updateFlames(dt);
    this.updateSmoke(dt);
  }

  destroy(options?: boolean): void {
    this.flames.length = 0;
    this.smokes.length = 0;
    super.destroy(options);
  }

  private spawnFlames(intensity: number): void {
    while (this.flameSpawnAccum >= 1) {
      this.flameSpawnAccum -= 1;
      const slot = this.flames.find((f) => !f.active);
      if (!slot) break;

      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * (12 + intensity * 12);
      const ringX = Math.cos(angle) * radius * 1.6;
      const ringY = -Math.abs(Math.sin(angle) * radius * 0.32);
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

  private spawnSmoke(intensity: number): void {
    while (this.smokeSpawnAccum >= 1) {
      this.smokeSpawnAccum -= 1;
      if (Math.random() < 0.32) continue;

      const slot = this.smokes.find((s) => !s.active);
      if (!slot) break;

      const sway = Math.sin(this.emitterTime * 1.1) * (4 + intensity * 4);
      const xJitter = (Math.random() - 0.5) * (46 + intensity * 30);
      const yJitter = Math.random() * 8 - 14;

      this.resetSmoke(
        slot,
        this.spawnX + sway + xJitter,
        this.spawnY + yJitter,
      );
    }
  }

  private resetFlame(p: FlameState, x: number, y: number): void {
    p.active = true;
    p.age = 0;
    p.sprite.x = x;
    p.sprite.y = y;
    p.sprite.tint = 0xffffea;

    p.coreHeat = this.rand(0, 1);
    const base = this.rand(0.76, 1.42);
    const widthBias = 0.74 + (1 - p.coreHeat) * 0.42;
    const heightBias = 1.2 + p.coreHeat * 0.95;
    p.baseScaleX = base * this.rand(0.72, 1.08) * widthBias;
    p.baseScaleY = base * this.rand(1.02, 1.75) * heightBias * 0.88;
    p.baseAlpha = this.rand(0.52, 0.86) + p.coreHeat * 0.14;

    const lateralDrift = 16 - p.coreHeat * 8;
    p.vx = this.rand(-lateralDrift, lateralDrift);
    p.vy =
      -this.rand(128 + p.coreHeat * 32, 215 + p.coreHeat * 52) *
      FireEffect.RISE_SCALE;
    p.outwardDrift = this.rand(-16, 16) * (0.5 + (1 - p.coreHeat) * 0.44);
    p.lifetime = this.rand(0.78, 1.45) - p.coreHeat * 0.12;
    p.lift = (this.rand(58, 100) + p.coreHeat * 22) * FireEffect.RISE_SCALE;

    p.wobblePhase = this.rand(0, Math.PI * 2);
    p.wobbleFreq = this.rand(3.8, 7.1);
    p.wobbleAmp = this.rand(12, 28) * (0.7 + (1 - p.coreHeat) * 0.45);
    p.spin = this.rand(-0.44, 0.44);
    p.flickerPhase = this.rand(0, Math.PI * 2);
    p.flickerFreq = this.rand(11, 23);
    p.turbPhase = this.rand(0, Math.PI * 2);
    p.turbFreq = this.rand(7, 13);

    p.sprite.scale.set(p.baseScaleX, p.baseScaleY);
    p.sprite.rotation = this.rand(-0.05, 0.05);
    p.sprite.alpha = 0;
  }

  private resetSmoke(p: SmokeState, x: number, y: number): void {
    p.active = true;
    p.age = 0;
    p.sprite.x = x;
    p.sprite.y = y;
    p.sprite.tint = 0x5e554d;

    const base = this.rand(0.74, 1.22);
    p.baseScaleX = base * this.rand(0.85, 1.3);
    p.baseScaleY = base * this.rand(0.9, 1.36);
    p.baseAlpha = this.rand(0.16, 0.34);

    p.vx = this.rand(-22, 22);
    p.vy = -this.rand(36, 82);
    p.lifetime = this.rand(1.25, 2.5);

    p.driftPhase = this.rand(0, Math.PI * 2);
    p.driftFreq = this.rand(1.4, 2.9);
    p.driftAmp = this.rand(10, 24);
    p.spin = this.rand(-0.25, 0.25);

    p.sprite.scale.set(p.baseScaleX, p.baseScaleY);
    p.sprite.rotation = this.rand(-0.2, 0.2);
    p.sprite.alpha = 0;
  }

  private updateFlames(dt: number): void {
    for (const p of this.flames) {
      if (!p.active) continue;

      p.age += dt;
      const progress = Math.min(1, p.age / p.lifetime);
      const remaining = 1 - progress;

      if (p.age >= p.lifetime) {
        p.active = false;
        p.sprite.alpha = 0;
        continue;
      }

      const fadeIn = Math.min(1, progress / 0.08);
      const fadeOut = Math.pow(remaining, 0.86);

      const buoyancy = p.lift * (0.72 + progress * 0.58);
      p.vy -= buoyancy * dt;
      p.vx *= Math.max(0, 1 - 2.8 * dt);

      const wobble =
        Math.sin(p.age * p.wobbleFreq + p.wobblePhase) *
        p.wobbleAmp *
        (0.28 + progress * 0.58);
      const turbulence =
        Math.sin(p.age * p.turbFreq + p.turbPhase) *
        (7 + p.coreHeat * 4) *
        (0.24 + progress * 0.52);
      const spread = p.outwardDrift * (0.16 + progress * 0.58);
      const flickerAmp = 0.1 + (1 - p.coreHeat) * 0.07;
      const flicker = Math.max(
        0.68,
        0.9 + flickerAmp * Math.sin(p.age * p.flickerFreq + p.flickerPhase),
      );

      p.sprite.x += (p.vx + wobble + turbulence + spread) * dt;
      p.sprite.y += p.vy * dt;
      p.sprite.alpha =
        p.baseAlpha * fadeIn * fadeOut * flicker * (0.92 + p.coreHeat * 0.12);

      const widthGrowth = 0.72 + 0.62 * progress + (1 - p.coreHeat) * 0.12;
      const heightDecay = 1.34 - 0.42 * progress + p.coreHeat * 0.08;
      p.sprite.scale.x = p.baseScaleX * widthGrowth;
      p.sprite.scale.y = p.baseScaleY * Math.max(0.38, heightDecay);

      p.sprite.rotation += p.spin * dt;
      p.sprite.tint = this.flameTint(progress, p.coreHeat);
    }
  }

  private updateSmoke(dt: number): void {
    for (const p of this.smokes) {
      if (!p.active) continue;

      p.age += dt;
      const progress = Math.min(1, p.age / p.lifetime);
      const remaining = 1 - progress;

      if (p.age >= p.lifetime) {
        p.active = false;
        p.sprite.alpha = 0;
        continue;
      }

      const fadeIn = Math.min(1, progress / 0.22);
      const fadeOut = Math.pow(remaining, 1.28);

      p.vy -= 18 * dt;
      p.vx *= Math.max(0, 1 - 1.6 * dt);
      const drift =
        Math.sin(p.age * p.driftFreq + p.driftPhase) *
        p.driftAmp *
        (0.42 + remaining * 0.58);

      p.sprite.x += (p.vx + drift) * dt;
      p.sprite.y += p.vy * dt;
      p.sprite.alpha = p.baseAlpha * fadeIn * fadeOut;

      p.sprite.scale.x = p.baseScaleX * (1 + 0.9 * progress);
      p.sprite.scale.y = p.baseScaleY * (1 + 1.06 * progress);

      p.sprite.rotation += p.spin * dt;
      p.sprite.tint = this.smokeTint(progress);
    }
  }

  private flameTint(progress: number, coreHeat: number): number {
    const t = 1 - coreHeat;
    const hotCore = this.lerpColor(0xfffff0, 0xfff4c4, t);
    const warmMid = this.lerpColor(0xfff6c2, 0xffd27a, t);
    const orange = this.lerpColor(0xffd27a, 0xff8a24, t);
    const red = this.lerpColor(0xff8a24, 0xc81912, t);
    const ember = this.lerpColor(0x4b0506, 0x1e0102, coreHeat * 0.6);

    if (progress < 0.16) {
      return this.lerpColor(hotCore, warmMid, progress / 0.16);
    }
    if (progress < 0.52) {
      return this.lerpColor(warmMid, orange, (progress - 0.16) / 0.36);
    }
    if (progress < 0.82) {
      return this.lerpColor(orange, red, (progress - 0.52) / 0.3);
    }
    return this.lerpColor(red, ember, (progress - 0.82) / 0.18);
  }

  private smokeTint(progress: number): number {
    if (progress < 0.58) {
      return this.lerpColor(0x61574f, 0x4b423b, progress / 0.58);
    }
    return this.lerpColor(0x4b423b, 0x191615, (progress - 0.58) / 0.42);
  }

  private lerpColor(from: number, to: number, t: number): number {
    const f = Math.max(0, Math.min(1, t));
    const r = Math.round(
      ((from >> 16) & 0xff) + (((to >> 16) & 0xff) - ((from >> 16) & 0xff)) * f,
    );
    const g = Math.round(
      ((from >> 8) & 0xff) + (((to >> 8) & 0xff) - ((from >> 8) & 0xff)) * f,
    );
    const b = Math.round((from & 0xff) + ((to & 0xff) - (from & 0xff)) * f);
    return (r << 16) | (g << 8) | b;
  }

  private rand(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private generateFlameTexture(): Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 192;
    const ctx = canvas.getContext("2d");
    if (!ctx) return Texture.WHITE;

    const outerGlow = ctx.createRadialGradient(96, 118, 14, 96, 118, 92);
    outerGlow.addColorStop(0, "rgba(255, 194, 112, 0.86)");
    outerGlow.addColorStop(0.4, "rgba(255, 124, 40, 0.54)");
    outerGlow.addColorStop(0.72, "rgba(178, 26, 12, 0.28)");
    outerGlow.addColorStop(1, "rgba(42, 2, 4, 0)");
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(96, 118, 92, 0, Math.PI * 2);
    ctx.fill();

    const body = ctx.createLinearGradient(96, 18, 96, 186);
    body.addColorStop(0, "rgba(255, 236, 170, 0)");
    body.addColorStop(0.2, "rgba(255, 216, 132, 0.2)");
    body.addColorStop(0.5, "rgba(255, 156, 50, 0.54)");
    body.addColorStop(0.82, "rgba(210, 42, 16, 0.34)");
    body.addColorStop(1, "rgba(60, 3, 5, 0)");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(96, 18);
    ctx.bezierCurveTo(146, 62, 154, 128, 96, 178);
    ctx.bezierCurveTo(38, 128, 46, 62, 96, 18);
    ctx.closePath();
    ctx.fill();

    const core = ctx.createRadialGradient(96, 110, 6, 96, 110, 44);
    core.addColorStop(0, "rgba(255, 255, 244, 0.96)");
    core.addColorStop(0.34, "rgba(255, 236, 168, 0.9)");
    core.addColorStop(0.66, "rgba(255, 146, 36, 0.56)");
    core.addColorStop(1, "rgba(196, 28, 14, 0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.moveTo(96, 42);
    ctx.bezierCurveTo(126, 78, 130, 124, 96, 160);
    ctx.bezierCurveTo(62, 124, 66, 78, 96, 42);
    ctx.closePath();
    ctx.fill();

    const baseGlow = ctx.createRadialGradient(96, 152, 6, 96, 152, 48);
    baseGlow.addColorStop(0, "rgba(255, 204, 120, 0.5)");
    baseGlow.addColorStop(0.54, "rgba(255, 96, 24, 0.24)");
    baseGlow.addColorStop(1, "rgba(76, 6, 8, 0)");
    ctx.fillStyle = baseGlow;
    ctx.beginPath();
    ctx.ellipse(96, 152, 62, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    return Texture.from(canvas);
  }

  private generateSmokeTexture(): Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    if (!ctx) return Texture.WHITE;

    const body = ctx.createRadialGradient(80, 88, 8, 80, 88, 66);
    body.addColorStop(0, "rgba(118, 109, 102, 0.36)");
    body.addColorStop(0.45, "rgba(74, 68, 64, 0.26)");
    body.addColorStop(1, "rgba(20, 18, 18, 0)");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(80, 88, 66, 0, Math.PI * 2);
    ctx.fill();

    const plume = ctx.createLinearGradient(80, 18, 80, 152);
    plume.addColorStop(0, "rgba(124, 116, 108, 0)");
    plume.addColorStop(0.28, "rgba(102, 95, 88, 0.2)");
    plume.addColorStop(0.68, "rgba(70, 64, 60, 0.26)");
    plume.addColorStop(1, "rgba(23, 21, 20, 0)");
    ctx.fillStyle = plume;
    ctx.beginPath();
    ctx.ellipse(80, 86, 40, 56, 0, 0, Math.PI * 2);
    ctx.fill();

    return Texture.from(canvas);
  }
}
