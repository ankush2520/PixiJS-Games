import { Container, Sprite, Text, Texture } from "pixi.js";

type RichTextToken =
  | { type: "text"; value: string }
  | { type: "emoji"; name: string };

export class RichTextRenderer extends Container {
  private static readonly FALLBACK_EMOJI_NAME = "neutral";
  private static readonly emojiTextureCache = new Map<
    string,
    Promise<Texture | null>
  >();
  private readonly text: string;
  private readonly maxWidth: number;
  private readonly emojiUrlByName: Map<string, string>;
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
    const emojiPattern = /\{([^{}]+)\}/g;
    let currentIndex = 0;
    let match = emojiPattern.exec(this.text);

    while (match) {
      const matchIndex = match.index;
      if (matchIndex > currentIndex) {
        tokens.push({
          type: "text",
          value: this.text.slice(currentIndex, matchIndex),
        });
      }

      tokens.push({ type: "emoji", name: match[1] });
      currentIndex = emojiPattern.lastIndex;
      match = emojiPattern.exec(this.text);
    }

    if (currentIndex < this.text.length) {
      tokens.push({ type: "text", value: this.text.slice(currentIndex) });
    }

    return tokens;
  }

  private getEmojiTexture(url: string): Promise<Texture | null> {
    const cachedTexture = RichTextRenderer.emojiTextureCache.get(url);
    if (cachedTexture) {
      return cachedTexture;
    }

    const texturePromise = this.loadTextureFromUrl(url);
    RichTextRenderer.emojiTextureCache.set(url, texturePromise);
    return texturePromise;
  }

  private loadTextureFromUrl(url: string): Promise<Texture | null> {
    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        try {
          resolve(Texture.from(image));
        } catch {
          resolve(null);
        }
      };
      image.onerror = () => resolve(null);
      image.src = url;
    });
  }

  private resolveEmojiUrl(name: string): string | null {
    const normalizedName = name.trim().toLowerCase();
    const directUrl = this.emojiUrlByName.get(normalizedName);
    if (directUrl) {
      return directUrl;
    }

    return (
      this.emojiUrlByName.get(RichTextRenderer.FALLBACK_EMOJI_NAME) ?? null
    );
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

      const emojiUrl = this.resolveEmojiUrl(token.name);
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
