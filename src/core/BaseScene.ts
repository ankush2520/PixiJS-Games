import { Container } from "pixi.js";

export class BaseScene extends Container {
  onEnter(): void {
    // Optional hook for setup when scene becomes active.
  }

  onExit(): void {
    // Optional hook for cleanup when scene is removed.
  }

  resize(_width: number, _height: number): void {
    // Optional hook for resize handling.
  }

  update(_dt: number): void {
    // Optional hook for per-frame updates.
  }
}
