import { Application } from "pixi.js";
import { BaseScene } from "./BaseScene";

/**
 * Scene Manager
 *
 * Manages the lifecycle of game scenes:
 * - Shows/hides scenes
 * - Handles scene transitions (cleanup and initialization)
 * - Forwards update loop and resize events to active scene
 */
export class SceneManager {
  private readonly app: Application;
  private currentScene: BaseScene | null = null;

  constructor(app: Application) {
    this.app = app;
    // Register update loop for active scene
    this.app.ticker.add((ticker) => {
      this.currentScene?.update(ticker.deltaTime);
    });
  }

  /**
   * Shows a new scene and cleans up the previous one
   *
   * Process:
   * 1. Call onExit() on current scene (cleanup logic)
   * 2. Remove and destroy current scene
   * 3. Add new scene to stage
   * 4. Call onEnter() on new scene (initialization logic)
   *
   * @param scene - Scene to show
   */
  show(scene: BaseScene): void {
    if (this.currentScene) {
      this.currentScene.onExit();
      this.app.stage.removeChild(this.currentScene);
      this.currentScene.destroy({ children: true });
    }

    this.currentScene = scene;
    // Add scene at index 0 to ensure UI elements added later stay on top
    this.app.stage.addChildAt(scene, 0);
    this.currentScene.onEnter();
  }

  /**
   * Forwards resize event to active scene
   * @param width - New viewport width
   * @param height - New viewport height
   */
  resize(width: number, height: number): void {
    this.currentScene?.resize(width, height);
  }
}
