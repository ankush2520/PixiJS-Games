import { Container, Sprite, Text, Texture } from "pixi.js";

/**
 * Token types for rich text parsing
 * - text: Regular text content
 * - emoji: Emoji placeholder with name (e.g., {smile})
 */
type RichTextToken =
  | { type: "text"; value: string }
  | { type: "emoji"; name: string };

/**
 * Rich Text Renderer with Emoji Support
 *
 * Renders text with inline emoji images in a PixiJS container.
 * Features:
 * - Emoji syntax: {emoji_name} gets replaced with emoji image
 * - Automatic text wrapping at specified width
 * - Word-based wrapping (doesn't break mid-word)
 * - Texture caching for efficient emoji loading
 * - Async rendering to handle image loading
 *
 * Example usage:
 * ```typescript
 * const emojiMap = new Map([["smile", "https://...emoji.png"]]);
 * const renderer = new RichTextRenderer("Hello {smile}!", 300, emojiMap);
 * await renderer.render();
 * ```
 *
 * Performance Optimizations:
 * - Static texture cache shared across all instances
 * - Render versioning to cancel outdated renders
 * - Texture reuse for repeated emojis
 */
export class RichTextRenderer extends Container {
  /** Default emoji used when requested emoji is not found */
  private static readonly FALLBACK_EMOJI_NAME = "neutral";

  /** Shared texture cache to avoid reloading same emojis across instances */
  private static readonly emojiTextureCache = new Map<
    string,
    Promise<Texture | null>
  >();

  /** Original text string with emoji placeholders */
  private readonly text: string;

  /** Maximum width in pixels before wrapping to next line */
  private readonly maxWidth: number;

  /** Map of emoji names to their image URLs */
  private readonly emojiUrlByName: Map<string, string>;

  /** Incremented on each render to cancel outdated async operations */
  private renderVersion = 0;

  /** Text styling configuration */
  private readonly textStyle = {
    fill: 0xffffff, // White text
    fontFamily: "Arial",
    fontSize: 20,
    lineHeight: 28, // Space between lines (includes font size + padding)
  };

  /**
   * Constructs a new RichTextRenderer
   * @param text - Text content with emoji placeholders (e.g., "Hello {smile}!")
   * @param maxWidth - Maximum width in pixels before text wraps
   * @param emojiUrlByName - Map of emoji names to their image URLs
   */
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

  /**
   * Parses text into tokens (text segments and emoji placeholders)
   *
   * Example:
   * "Hello {smile} world {heart}" -> [
   *   { type: "text", value: "Hello " },
   *   { type: "emoji", name: "smile" },
   *   { type: "text", value: " world " },
   *   { type: "emoji", name: "heart" }
   * ]
   *
   * @returns Array of tokens representing text and emoji elements
   */
  private parseText(): RichTextToken[] {
    const tokens: RichTextToken[] = [];

    // Regex to match emoji syntax: {emoji_name}
    const emojiPattern = /\{([^{}]+)\}/g;
    let currentIndex = 0;
    let match = emojiPattern.exec(this.text);

    // Extract text segments and emoji placeholders
    while (match) {
      const matchIndex = match.index;

      // Add text before the emoji (if any)
      if (matchIndex > currentIndex) {
        tokens.push({
          type: "text",
          value: this.text.slice(currentIndex, matchIndex),
        });
      }

      // Add the emoji token
      tokens.push({ type: "emoji", name: match[1] });
      currentIndex = emojiPattern.lastIndex;
      match = emojiPattern.exec(this.text);
    }

    // Add remaining text after the last emoji (if any)
    if (currentIndex < this.text.length) {
      tokens.push({ type: "text", value: this.text.slice(currentIndex) });
    }

    return tokens;
  }

  /**
   * Retrieves emoji texture from cache or loads it
   * Uses shared static cache for performance optimization
   *
   * @param url - Image URL of the emoji
   * @returns Promise resolving to Texture or null if load fails
   */
  private getEmojiTexture(url: string): Promise<Texture | null> {
    // Check if texture is already cached
    const cachedTexture = RichTextRenderer.emojiTextureCache.get(url);
    if (cachedTexture) {
      return cachedTexture;
    }

    // Load and cache the texture for future use
    const texturePromise = this.loadTextureFromUrl(url);
    RichTextRenderer.emojiTextureCache.set(url, texturePromise);
    return texturePromise;
  }

  /**
   * Loads a texture from a remote image URL
   * Handles CORS and errors gracefully by returning null on failure
   *
   * @param url - Image URL to load
   * @returns Promise resolving to Texture or null if load fails
   */
  private loadTextureFromUrl(url: string): Promise<Texture | null> {
    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = "anonymous"; // Enable CORS for external images

      image.onload = () => {
        try {
          resolve(Texture.from(image));
        } catch {
          // Texture creation failed
          resolve(null);
        }
      };

      image.onerror = () => resolve(null); // Image load failed
      image.src = url;
    });
  }

  /**
   * Resolves emoji name to its URL
   * Falls back to default "neutral" emoji if name not found
   *
   * @param name - Emoji name from placeholder (e.g., "smile")
   * @returns URL of emoji image or null if not found
   */
  private resolveEmojiUrl(name: string): string | null {
    const normalizedName = name.trim().toLowerCase();
    const directUrl = this.emojiUrlByName.get(normalizedName);
    if (directUrl) {
      return directUrl;
    }

    // Use fallback emoji if requested one doesn't exist
    return (
      this.emojiUrlByName.get(RichTextRenderer.FALLBACK_EMOJI_NAME) ?? null
    );
  }

  /**
   * Renders the rich text with emojis
   *
   * Process:
   * 1. Parse text into tokens (text + emoji)
   * 2. Layout text and emojis with word wrapping
   * 3. Load emoji textures asynchronously
   * 4. Position all elements in the container
   *
   * Uses render versioning to cancel outdated renders if render() is called
   * multiple times before previous renders complete.
   *
   * Layout Rules:
   * - Text wraps by word (no mid-word breaks)
   * - Emojis treated as individual units
   * - Line height: 28px, Emoji size: 24px
   * - Emojis vertically centered in line
   */
  async render(): Promise<void> {
    // Increment version to invalidate any in-progress renders
    this.renderVersion++;
    const currentRenderVersion = this.renderVersion;
    this.removeChildren();
    const tokens = this.parseText();

    // Layout configuration
    const lineHeight = 28; // Vertical space per line
    const emojiSize = 24; // Emoji width and height in pixels
    const emojiGap = 4; // Space after each emoji

    // Current cursor position for placing elements
    let cursorX = 0;
    let cursorY = 0;

    /**
     * Places text with word-based wrapping
     * Splits by whitespace to prevent mid-word breaks
     */
    const placeText = (rawText: string): void => {
      // Split into segments (words + spaces) while preserving whitespace
      const segments = rawText.split(/(\s+)/g).filter((segment) => segment);

      for (const segment of segments) {
        const segmentNode = new Text({
          text: segment,
          style: this.textStyle,
        });

        // Wrap to next line if segment doesn't fit
        if (cursorX > 0 && cursorX + segmentNode.width > this.maxWidth) {
          cursorX = 0;
          cursorY += lineHeight;
        }

        segmentNode.position.set(cursorX, cursorY);
        this.addChild(segmentNode);
        cursorX += segmentNode.width;
      }
    };

    // Process each token (text or emoji)
    for (const token of tokens) {
      if (token.type === "text") {
        placeText(token.value);
        continue;
      }

      // Handle emoji token
      const emojiUrl = this.resolveEmojiUrl(token.name);
      if (!emojiUrl) {
        // Emoji not found, show placeholder text
        placeText(`{${token.name}}`);
        continue;
      }

      // Load emoji texture asynchronously
      const texture = await this.getEmojiTexture(emojiUrl);

      // Check if a newer render has started (cancel this one)
      if (currentRenderVersion !== this.renderVersion) {
        return;
      }

      if (!texture) {
        // Texture load failed, show placeholder text
        placeText(`{${token.name}}`);
        continue;
      }

      // Check if emoji fits on current line, wrap if needed
      const emojiAdvanceWidth = emojiSize + emojiGap;
      if (cursorX > 0 && cursorX + emojiAdvanceWidth > this.maxWidth) {
        cursorX = 0;
        cursorY += lineHeight;
      }

      // Create and position emoji sprite
      const emojiSprite = new Sprite(texture);
      emojiSprite.width = emojiSize;
      emojiSprite.height = emojiSize;
      // Vertically center emoji in the line
      emojiSprite.position.set(cursorX, cursorY + (lineHeight - emojiSize) / 2);
      this.addChild(emojiSprite);

      cursorX += emojiAdvanceWidth;
    }
  }
}
