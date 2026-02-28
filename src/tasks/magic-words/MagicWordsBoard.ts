import { Container } from "pixi.js";

const MAGIC_WORDS_API_URL =
  "https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords";

export class MagicWordsBoard extends Container {
  private readonly messagesContainer: Container;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private dialogue: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private emojies: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private avatars: any[] = [];

  constructor() {
    super();
    this.messagesContainer = new Container();
    this.addChild(this.messagesContainer);
  }

  async init(): Promise<void> {
    await this.loadData();
    // this.renderDialogue();
  }

  async loadData(): Promise<void> {
    const response = await fetch(MAGIC_WORDS_API_URL);
    const data = await response.json();

    this.dialogue = data.dialogue;
    this.emojies = data.emojies;
    this.avatars = data.avatars;

    console.log(this.dialogue);
  }

  renderDialogue(): void {}

  resize(width: number, height: number): void {
    this.messagesContainer.position.set(width / 2, height / 2);
  }
}
