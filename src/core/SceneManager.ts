import { Application } from "pixi.js";
import { BaseScene } from "./BaseScene";

export class SceneManager {
  private readonly app: Application;
  private currentScene: BaseScene | null = null;

  constructor(app: Application) {
    this.app = app;
    this.app.ticker.add((ticker) => {
      this.currentScene?.update(ticker.deltaTime);
    });
  }

  show(scene: BaseScene): void {
    if (this.currentScene) {
      this.currentScene.onExit();
      this.app.stage.removeChild(this.currentScene);
      this.currentScene.destroy({ children: true });
    }

    this.currentScene = scene;
    this.app.stage.addChild(scene);
    this.currentScene.onEnter();
  }

  resize(width: number, height: number): void {
    this.currentScene?.resize(width, height);
  }
}
