import { Application } from "pixi.js";
import { SceneManager } from "./SceneManager";
import { MenuScene } from "../scenes/MenuScene";
import { FpsCounter } from "../Common_UI/FpsCounter";
import { AceOfShadowsScene } from "../scenes/AceOfShadowsScene";
import { MagicWordsScene } from "../scenes/MagicWordsScene";
import { PhoenixFlameScene } from "../scenes/PhoenixFlameScene";

/**
 * Main Application Controller
 *
 * Responsibilities:
 * - Initialize PixiJS application
 * - Setup scene manager and register all game scenes
 * - Handle global UI (FPS counter)
 * - Manage window resize events
 * - Coordinate application lifecycle (start, update loop)
 */
export class App {
  private readonly app: Application;
  private sceneManager: SceneManager | null = null;
  private fpsCounter: FpsCounter | null = null;

  constructor() {
    this.app = new Application();
  }

  /**
   * Initialize and start the application
   *
   * This method:
   * 1. Initializes PixiJS with renderer settings
   * 2. Sets up the scene manager and registers all scenes
   * 3. Starts the menu scene
   * 4. Adds FPS counter for performance monitoring
   * 5. Appends canvas to DOM and begins update loop
   */
  async start(): Promise<void> {
    // Initialize PixiJS application with window size and dark background
    await this.app.init({
      resizeTo: window,
      antialias: true,
      background: "#06080d",
    });

    // Configure ticker for 60 FPS target
    this.app.ticker.maxFPS = 60;
    this.app.ticker.minFPS = 60;

    // Enable mouse wheel events for scrolling in games
    this.app.renderer.events.features.wheel = true;

    // Create and initialize scene manager
    const sceneManager = new SceneManager(this.app);
    this.sceneManager = sceneManager;

    // Style the canvas to be fullscreen
    const view = this.app.canvas;
    view.style.width = "100%";
    view.style.height = "100%";
    view.style.display = "block";
    view.style.position = "fixed";
    view.style.top = "0";
    view.style.left = "0";

    document.body.style.margin = "0";
    document.body.appendChild(view);

    // Handle window resize - notify scene manager and FPS counter
    window.addEventListener("resize", () => {
      this.sceneManager?.resize(
        this.app.renderer.width,
        this.app.renderer.height,
      );
      this.fpsCounter?.resize();
    });

    // Helper to resize the current scene
    const resizeCurrentScene = (): void => {
      sceneManager.resize(this.app.renderer.width, this.app.renderer.height);
    };

    // Navigation functions - each game has its own scene
    // All scenes receive a callback to return to menu
    const showAceOfShadows = (): void => {
      sceneManager.show(new AceOfShadowsScene(showMenu));
      resizeCurrentScene();
    };

    const showMagicWords = (): void => {
      sceneManager.show(new MagicWordsScene(showMenu));
      resizeCurrentScene();
    };

    const showPhoenixFlame = (): void => {
      sceneManager.show(new PhoenixFlameScene(showMenu));
      resizeCurrentScene();
    };

    const showMenu = (): void => {
      sceneManager.show(
        new MenuScene(showAceOfShadows, showMagicWords, showPhoenixFlame),
      );
      resizeCurrentScene();
    };

    showMenu();

    // Add global FPS counter last so it renders on top
    this.fpsCounter = new FpsCounter(this.app);
  }
}
