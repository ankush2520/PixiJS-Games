import { Container } from "pixi.js";

export class BaseScene extends Container {
  onEnter(): void {
    // Optional hook for setup when scene becomes active.
  }

  onExit(): void {
    // Optional hook for cleanup when scene is removed.
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resize(_width: number, _height: number): void {
    // Optional hook for resize handling.
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_dt: number): void {
    // Optional hook for per-frame updates.
  }
}
