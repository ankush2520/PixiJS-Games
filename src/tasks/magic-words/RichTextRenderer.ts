import { Assets, Container, Sprite, Text, Texture } from "pixi.js";

type RichTextToken =
  | { type: "text"; value: string }
  | { type: "emoji"; name: string };

export class RichTextRenderer extends Container {
  private readonly text: string;
  private readonly maxWidth: number;
  private readonly emojiUrlByName: Map<string, string>;
  private readonly emojiTextureCache = new Map<
    string,
    Promise<Texture | null>
  >();
  private renderVersion = 0;
  private readonly textStyle = {
    fill: 0xffffff,
    fontFamily: "Arial",
    fontSize: 20,
    lineHeight: 28,
  };

  constructor(
    text: string,
    maxWidth: number,
    emojiUrlByName: Map<string, string>,
  ) {
    super();
    this.text = text;
    this.maxWidth = maxWidth;
    this.emojiUrlByName = emojiUrlByName;
  }

  private parseText(): RichTextToken[] {
    const tokens: RichTextToken[] = [];
    const parts = this.text.split(/(\{[^{}]+\})/g);

    for (const part of parts) {
      if (!part) {
        continue;
      }

      const emojiMatch = part.match(/^\{([^{}]+)\}$/);
      if (emojiMatch) {
        tokens.push({ type: "emoji", name: emojiMatch[1] });
        continue;
      }

      tokens.push({ type: "text", value: part });
    }

    return tokens;
  }

  private extractTexture(asset: unknown): Texture | null {
    if (asset instanceof Texture) {
      return asset;
    }

    if (asset && typeof asset === "object" && "texture" in asset) {
      const texture = (asset as { texture?: unknown }).texture;
      if (texture instanceof Texture) {
        return texture;
      }
    }

    return null;
  }

  private getEmojiTexture(url: string): Promise<Texture | null> {
    const cachedTexture = this.emojiTextureCache.get(url);
    if (cachedTexture) {
      return cachedTexture;
    }

    const texturePromise = Assets.load(url)
      .then((asset) => this.extractTexture(asset))
      .catch(() => null);
    this.emojiTextureCache.set(url, texturePromise);
    return texturePromise;
  }

  async render(): Promise<void> {
    this.renderVersion++;
    const currentRenderVersion = this.renderVersion;
    this.removeChildren();
    const tokens = this.parseText();
    const lineHeight = 28;
    const emojiSize = 24;
    const emojiGap = 4;
    let cursorX = 0;
    let cursorY = 0;
    const placeText = (rawText: string): void => {
      const segments = rawText.split(/(\s+)/g).filter((segment) => segment);

      for (const segment of segments) {
        const segmentNode = new Text({
          text: segment,
          style: this.textStyle,
        });

        if (cursorX > 0 && cursorX + segmentNode.width > this.maxWidth) {
          cursorX = 0;
          cursorY += lineHeight;
        }

        segmentNode.position.set(cursorX, cursorY);
        this.addChild(segmentNode);
        cursorX += segmentNode.width;
      }
    };

    for (const token of tokens) {
      if (token.type === "text") {
        placeText(token.value);
        continue;
      }

      const emojiUrl = this.emojiUrlByName.get(token.name);
      if (!emojiUrl) {
        placeText(`{${token.name}}`);
        continue;
      }

      const texture = await this.getEmojiTexture(emojiUrl);
      if (currentRenderVersion !== this.renderVersion) {
        return;
      }
      if (!texture) {
        placeText(`{${token.name}}`);
        continue;
      }

      const emojiAdvanceWidth = emojiSize + emojiGap;
      if (cursorX > 0 && cursorX + emojiAdvanceWidth > this.maxWidth) {
        cursorX = 0;
        cursorY += lineHeight;
      }

      const emojiSprite = new Sprite(texture);
      emojiSprite.width = emojiSize;
      emojiSprite.height = emojiSize;
      emojiSprite.position.set(cursorX, cursorY + (lineHeight - emojiSize) / 2);
      this.addChild(emojiSprite);

      cursorX += emojiAdvanceWidth;
    }
  }
}
