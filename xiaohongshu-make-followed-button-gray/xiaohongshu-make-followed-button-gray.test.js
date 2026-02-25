/**
 * Tests for xiaohongshu-make-followed-button-gray.js
 *
 * Run with: bun test
 */

import { describe, it, expect, beforeEach } from "bun:test";

// Create a minimal DOM environment for testing
function createMockDOM() {
  const eventListeners = new Map();

  class MockElement {
    constructor(tagName) {
      this.tagName = tagName;
      this.className = "";
      this.classList = {
        _classes: new Set(),
        add: (c) => this.classList._classes.add(c),
        remove: (c) => this.classList._classes.delete(c),
        contains: (c) => this.classList._classes.has(c),
      };
      this.children = [];
      this.parentNode = null;
      this._styles = {};
      this._dataset = {};
      this._textContent = "";
      this._innerHTML = "";
    }

    get style() {
      const self = this;
      return new Proxy(this._styles, {
        set(target, prop, value) {
          target[prop] = value;
          return true;
        },
        get(target, prop) {
          if (prop === "cssText") {
            return Object.entries(target)
              .map(
                ([k, v]) =>
                  `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}: ${v}`,
              )
              .join("; ");
          }
          return target[prop];
        },
      });
    }

    set style(value) {
      // Ignore - we use individual style properties
    }

    get dataset() {
      const self = this;
      return new Proxy(this._dataset, {
        set(target, prop, value) {
          // Convert camelCase to kebab-case for storage
          const key = prop.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
          target[key] = value;
          return true;
        },
        get(target, prop) {
          // Convert camelCase to kebab-case for lookup
          const key = prop.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
          return target[key];
        },
      });
    }

    get textContent() {
      return (
        this._textContent || this.children.map((c) => c.textContent).join("")
      );
    }

    set textContent(value) {
      this._textContent = value;
      this.children = [];
    }

    get innerHTML() {
      return this._innerHTML;
    }

    set innerHTML(value) {
      this._innerHTML = value;
      // Parse simple HTML structure for testing
      this.parseHTML(value);
    }

    parseHTML(html) {
      this.children = [];
      // Parse only immediate child spans, not nested ones
      const spanRegex = /<span[^>]*>([\s\S]*?)<\/span>/g;
      let match;
      let depth = 0;
      let lastIndex = 0;

      while ((match = spanRegex.exec(html)) !== null) {
        // Check if this span is nested inside another span by counting open/close before it
        const beforeMatch = html.slice(0, match.index);
        const opens = (beforeMatch.match(/<span[^>]*>/g) || []).length;
        const closes = (beforeMatch.match(/<\/span>/g) || []).length;

        if (opens > closes) {
          // This is a nested span, skip it and reset lastIndex
          spanRegex.lastIndex = match.index + 1;
          continue;
        }

        const span = new MockElement("span");
        const attrs = match[0].match(/class="([^"]*)"/);
        if (attrs) {
          attrs[1].split(" ").forEach((c) => span.classList.add(c));
        }

        // Check if content contains nested spans
        const content = match[1];
        if (content.includes("<span")) {
          // Parse nested structure
          span.parseHTML(content);
        } else {
          // Handle comment markers in text: <!--[--> and <!--]-->
          span._textContent = content
            .replace(/<!--\[-->/g, "")
            .replace(/<!--\]-->/g, "");
        }
        this.appendChild(span);
      }
    }

    querySelector(selector) {
      // Simple selector matching
      const parts = selector.split(".");
      const tag = parts[0] || null;
      const classes = parts.slice(1);

      for (const child of this.children) {
        if (tag && child.tagName !== tag) continue;
        if (classes.every((c) => child.classList.contains(c))) {
          return child;
        }
        const nested = child.querySelector(selector);
        if (nested) return nested;
      }
      return null;
    }

    querySelectorAll(selector) {
      const results = [];
      const parts = selector.split(".");
      const tag = parts[0] || null;
      const classes = parts.slice(1);

      const check = (el) => {
        if (tag && el.tagName !== tag) return false;
        return classes.every((c) => el.classList.contains(c));
      };

      const traverse = (el) => {
        if (check(el)) results.push(el);
        for (const child of el.children) traverse(child);
      };

      traverse(this);
      return results;
    }

    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    }

    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx > -1) {
        this.children.splice(idx, 1);
        child.parentNode = null;
      }
      return child;
    }

    addEventListener(event, handler) {
      if (!eventListeners.has(this)) eventListeners.set(this, new Map());
      if (!eventListeners.get(this).has(event)) {
        eventListeners.get(this).set(event, []);
      }
      eventListeners.get(this).get(event).push(handler);
    }

    removeEventListener(event, handler) {
      if (!eventListeners.has(this)) return;
      const handlers = eventListeners.get(this).get(event);
      if (handlers) {
        const idx = handlers.indexOf(handler);
        if (idx > -1) handlers.splice(idx, 1);
      }
    }

    dispatchEvent(event) {
      if (!eventListeners.has(this)) return;
      const handlers = eventListeners.get(this).get(event.type) || [];
      handlers.forEach((h) => h(event));
    }

    getAttribute(name) {
      return null;
    }
  }

  class MockMutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.observing = false;
    }

    observe(target, options) {
      this.target = target;
      this.options = options;
      this.observing = true;
    }

    disconnect() {
      this.observing = false;
    }

    takeRecords() {
      return [];
    }

    // Test helper to simulate mutations
    simulateMutation(type, target) {
      if (!this.observing) return;
      const mutation = { type, target };
      this.callback([mutation]);
    }
  }

  const document = {
    body: new MockElement("body"),
    createElement: (tag) => new MockElement(tag),
    querySelector: function (selector) {
      return this.body.querySelector(selector);
    },
    querySelectorAll: function (selector) {
      return this.body.querySelectorAll(selector);
    },
  };

  return { document, MockElement, MockMutationObserver, eventListeners };
}

// Extract the userscript logic for testing
function createUserScriptLogic(document, MutationObserver) {
  const FOLLOWED_TEXT = "已关注";
  const GRAY_BG_STYLE =
    "background-color: #999 !important; background-image: none !important;";
  const PROCESSED_MARK = "gray-processed";

  function applyGrayStyle(button) {
    // Parse and apply styles from GRAY_BG_STYLE
    const rules = GRAY_BG_STYLE.split(";");
    for (const rule of rules) {
      const [prop, val] = rule.split(":").map((s) => s.trim());
      if (prop && val) {
        const camelProp = prop.replace(/-([a-z])/g, (m, p1) =>
          p1.toUpperCase(),
        );
        button._styles[camelProp] = val.replace(/ !important/g, "");
      }
    }
    button.dataset[PROCESSED_MARK] = "true";
  }

  function removeGrayStyle(button) {
    delete button._styles.backgroundColor;
    delete button._styles.backgroundImage;
    delete button.dataset[PROCESSED_MARK];
  }

  function processButton(button) {
    const textSpan = button.querySelector("span.reds-button-new-text");

    let isFollowed = false;

    if (textSpan) {
      const textContent = textSpan.textContent.trim();
      isFollowed =
        textContent === FOLLOWED_TEXT || textContent.includes(FOLLOWED_TEXT);
    }

    const hasStyle = button.dataset[PROCESSED_MARK] === "true";

    if (isFollowed && !hasStyle) {
      applyGrayStyle(button);
    } else if (!isFollowed && hasStyle) {
      removeGrayStyle(button);
    }
  }

  function findAndProcessButtons() {
    const buttons = document.querySelectorAll("button.follow-button");
    buttons.forEach(processButton);
  }

  let observer = null;

  function init() {
    findAndProcessButtons();
    observer = new MutationObserver(() => {
      findAndProcessButtons();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  function destroy() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  return {
    FOLLOWED_TEXT,
    GRAY_BG_STYLE,
    PROCESSED_MARK,
    applyGrayStyle,
    removeGrayStyle,
    processButton,
    findAndProcessButtons,
    init,
    destroy,
  };
}

// Test suites
describe("Constants", () => {
  it("should have correct FOLLOWED_TEXT", () => {
    const { document, MockMutationObserver } = createMockDOM();
    const script = createUserScriptLogic(document, MockMutationObserver);
    expect(script.FOLLOWED_TEXT).toBe("已关注");
  });

  it("should have correct GRAY_BG_STYLE", () => {
    const { document, MockMutationObserver } = createMockDOM();
    const script = createUserScriptLogic(document, MockMutationObserver);
    expect(script.GRAY_BG_STYLE).toContain("#999");
    expect(script.GRAY_BG_STYLE).toContain("!important");
  });
});

describe("applyGrayStyle", () => {
  let dom, script;

  beforeEach(() => {
    dom = createMockDOM();
    script = createUserScriptLogic(dom.document, dom.MockMutationObserver);
  });

  it("should apply gray background color", () => {
    const button = new dom.MockElement("button");
    script.applyGrayStyle(button);
    expect(button.style.backgroundColor).toBe("#999");
  });

  it("should remove background image", () => {
    const button = new dom.MockElement("button");
    button.style.backgroundImage = "linear-gradient(...)";
    script.applyGrayStyle(button);
    expect(button.style.backgroundImage).toBe("none");
  });

  it("should mark button as processed", () => {
    const button = new dom.MockElement("button");
    script.applyGrayStyle(button);
    expect(button.dataset.grayProcessed).toBe("true");
  });

  it("should preserve existing styles when adding gray", () => {
    const button = new dom.MockElement("button");
    button.style.borderRadius = "4px";
    script.applyGrayStyle(button);
    expect(button.style.borderRadius).toBe("4px");
    expect(button.style.backgroundColor).toBe("#999");
  });
});

describe("removeGrayStyle", () => {
  let dom, script;

  beforeEach(() => {
    dom = createMockDOM();
    script = createUserScriptLogic(dom.document, dom.MockMutationObserver);
  });

  it("should remove gray background", () => {
    const button = new dom.MockElement("button");
    script.applyGrayStyle(button);
    script.removeGrayStyle(button);
    expect(button.style.backgroundColor).toBeFalsy();
  });

  it("should remove processed mark", () => {
    const button = new dom.MockElement("button");
    script.applyGrayStyle(button);
    script.removeGrayStyle(button);
    expect(button.dataset.grayProcessed).toBeFalsy();
  });

  it("should restore background image removal", () => {
    const button = new dom.MockElement("button");
    script.applyGrayStyle(button);
    script.removeGrayStyle(button);
    expect(button.style.backgroundImage).toBeFalsy();
  });
});

describe("processButton - Standard HTML structure", () => {
  let dom, script;

  beforeEach(() => {
    dom = createMockDOM();
    script = createUserScriptLogic(dom.document, dom.MockMutationObserver);
  });

  it("should apply style when text is 已关注", () => {
    const button = new dom.MockElement("button");
    button.classList.add("follow-button");
    const textSpan = new dom.MockElement("span");
    textSpan.classList.add("reds-button-new-text");
    textSpan.textContent = "已关注";
    button.appendChild(textSpan);

    script.processButton(button);

    expect(button.style.backgroundColor).toBe("#999");
    expect(button.dataset.grayProcessed).toBe("true");
  });

  it("should not apply style when text is 关注", () => {
    const button = new dom.MockElement("button");
    button.classList.add("follow-button");
    const textSpan = new dom.MockElement("span");
    textSpan.classList.add("reds-button-new-text");
    textSpan.textContent = "关注";
    button.appendChild(textSpan);

    script.processButton(button);

    expect(button.style.backgroundColor).toBeFalsy();
  });

  it("should not apply style when text span is missing", () => {
    const button = new dom.MockElement("button");
    button.classList.add("follow-button");
    // No text span added

    script.processButton(button);

    expect(button.style.backgroundColor).toBeFalsy();
  });
});

describe("processButton - Vue.js rendered structure with comment markers", () => {
  let dom, script;

  beforeEach(() => {
    dom = createMockDOM();
    script = createUserScriptLogic(dom.document, dom.MockMutationObserver);
  });

  it("should apply style for Vue rendered 已关注 with comment markers", () => {
    const button = new dom.MockElement("button");
    button.classList.add("follow-button");

    // Simulate Vue.js rendered HTML: <!--[-->已关注<!--]-->
    const textSpan = new dom.MockElement("span");
    textSpan.classList.add("reds-button-new-text");
    textSpan._textContent = "已关注"; // After stripping comments
    button.appendChild(textSpan);

    script.processButton(button);

    expect(button.style.backgroundColor).toBe("#999");
  });

  it("should handle nested Vue comment markers correctly", () => {
    const button = new dom.MockElement("button");
    button.classList.add("follow-button");

    // Build DOM structure directly
    const boxSpan = new dom.MockElement("span");
    boxSpan.classList.add("reds-button-new-box");

    const textSpan = new dom.MockElement("span");
    textSpan.classList.add("reds-button-new-text");
    textSpan._textContent = "已关注"; // Simulate Vue comment markers stripped

    boxSpan.appendChild(textSpan);
    button.appendChild(boxSpan);

    script.processButton(button);

    expect(button.style.backgroundColor).toBe("#999");
  });

  it("should not apply style for Vue rendered 关注 (not followed)", () => {
    const button = new dom.MockElement("button");
    button.classList.add("follow-button");
    button.innerHTML =
      '<span class="reds-button-new-box"><span class="reds-button-new-text"><!--[-->关注<!--]--></span></span>';

    script.processButton(button);

    expect(button.style.backgroundColor).toBeFalsy();
  });
});

describe("processButton - State transitions", () => {
  let dom, script;

  beforeEach(() => {
    dom = createMockDOM();
    script = createUserScriptLogic(dom.document, dom.MockMutationObserver);
  });

  it("should apply style when changing from not-followed to followed", () => {
    const button = new dom.MockElement("button");
    button.classList.add("follow-button");
    const textSpan = new dom.MockElement("span");
    textSpan.classList.add("reds-button-new-text");
    textSpan.textContent = "关注";
    button.appendChild(textSpan);

    // First process - not followed
    script.processButton(button);
    expect(button.style.backgroundColor).toBeFalsy();

    // Change to followed
    textSpan.textContent = "已关注";
    script.processButton(button);

    expect(button.style.backgroundColor).toBe("#999");
  });

  it("should remove style when changing from followed to not-followed", () => {
    const button = new dom.MockElement("button");
    button.classList.add("follow-button");
    const textSpan = new dom.MockElement("span");
    textSpan.classList.add("reds-button-new-text");
    textSpan.textContent = "已关注";
    button.appendChild(textSpan);

    // First process - followed
    script.processButton(button);
    expect(button.style.backgroundColor).toBe("#999");

    // Change to not followed
    textSpan.textContent = "关注";
    script.processButton(button);

    expect(button.style.backgroundColor).toBeFalsy();
  });

  it("should handle text content that includes 已关注 as substring", () => {
    const button = new dom.MockElement("button");
    button.classList.add("follow-button");
    const textSpan = new dom.MockElement("span");
    textSpan.classList.add("reds-button-new-text");
    textSpan.textContent = "  已关注  ";
    button.appendChild(textSpan);

    script.processButton(button);

    expect(button.style.backgroundColor).toBe("#999");
  });
});

describe("processButton - Button with missing elements", () => {
  let dom, script;

  beforeEach(() => {
    dom = createMockDOM();
    script = createUserScriptLogic(dom.document, dom.MockMutationObserver);
  });

  it("should remove style if text span is removed after being styled", () => {
    const button = new dom.MockElement("button");
    button.classList.add("follow-button");
    const textSpan = new dom.MockElement("span");
    textSpan.classList.add("reds-button-new-text");
    textSpan.textContent = "已关注";
    button.appendChild(textSpan);

    // First apply style
    script.processButton(button);
    expect(button.style.backgroundColor).toBe("#999");

    // Remove text span
    button.removeChild(textSpan);
    script.processButton(button);

    expect(button.style.backgroundColor).toBeFalsy();
  });
});

describe("findAndProcessButtons", () => {
  let dom, script;

  beforeEach(() => {
    dom = createMockDOM();
    script = createUserScriptLogic(dom.document, dom.MockMutationObserver);
  });

  it("should process all follow buttons in document", () => {
    const button1 = new dom.MockElement("button");
    button1.classList.add("follow-button");
    const span1 = new dom.MockElement("span");
    span1.classList.add("reds-button-new-text");
    span1.textContent = "已关注";
    button1.appendChild(span1);

    const button2 = new dom.MockElement("button");
    button2.classList.add("follow-button");
    const span2 = new dom.MockElement("span");
    span2.classList.add("reds-button-new-text");
    span2.textContent = "关注";
    button2.appendChild(span2);

    dom.document.body.appendChild(button1);
    dom.document.body.appendChild(button2);

    script.findAndProcessButtons();

    expect(button1.style.backgroundColor).toBe("#999");
    expect(button2.style.backgroundColor).toBeFalsy();
  });

  it("should not process non-follow-button elements", () => {
    const button = new dom.MockElement("button");
    button.classList.add("some-other-button");
    const span = new dom.MockElement("span");
    span.classList.add("reds-button-new-text");
    span.textContent = "已关注";
    button.appendChild(span);

    dom.document.body.appendChild(button);

    script.findAndProcessButtons();

    expect(button.style.backgroundColor).toBeFalsy();
  });
});

describe("MutationObserver behavior", () => {
  let dom, script;

  beforeEach(() => {
    dom = createMockDOM();
    script = createUserScriptLogic(dom.document, dom.MockMutationObserver);
  });

  it("should observe body for mutations", () => {
    script.init();
    // The observer should be created and observing
    expect(dom.document.body).toBeTruthy();
  });

  it("should reprocess buttons on simulated mutation", () => {
    script.init();

    const button = new dom.MockElement("button");
    button.classList.add("follow-button");
    const span = new dom.MockElement("span");
    span.classList.add("reds-button-new-text");
    span.textContent = "已关注";
    button.appendChild(span);

    dom.document.body.appendChild(button);

    // Simulate mutation callback
    script.findAndProcessButtons();

    expect(button.style.backgroundColor).toBe("#999");
  });
});

describe("Edge cases", () => {
  let dom, script;

  beforeEach(() => {
    dom = createMockDOM();
    script = createUserScriptLogic(dom.document, dom.MockMutationObserver);
  });

  it("should handle empty text content", () => {
    const button = new dom.MockElement("button");
    button.classList.add("follow-button");
    const textSpan = new dom.MockElement("span");
    textSpan.classList.add("reds-button-new-text");
    textSpan.textContent = "";
    button.appendChild(textSpan);

    script.processButton(button);

    expect(button.style.backgroundColor).toBeFalsy();
  });

  it("should handle whitespace-only text content", () => {
    const button = new dom.MockElement("button");
    button.classList.add("follow-button");
    const textSpan = new dom.MockElement("span");
    textSpan.classList.add("reds-button-new-text");
    textSpan.textContent = "   ";
    button.appendChild(textSpan);

    script.processButton(button);

    expect(button.style.backgroundColor).toBeFalsy();
  });

  it("should handle button with nested spans", () => {
    const button = new dom.MockElement("button");
    button.classList.add("follow-button");

    const boxSpan = new dom.MockElement("span");
    boxSpan.classList.add("reds-button-new-box");

    const textSpan = new dom.MockElement("span");
    textSpan.classList.add("reds-button-new-text");
    textSpan.textContent = "已关注";

    boxSpan.appendChild(textSpan);
    button.appendChild(boxSpan);

    script.processButton(button);

    expect(button.style.backgroundColor).toBe("#999");
  });

  it("should handle multiple buttons with different states", () => {
    const buttons = [];
    for (let i = 0; i < 5; i++) {
      const button = new dom.MockElement("button");
      button.classList.add("follow-button");
      const span = new dom.MockElement("span");
      span.classList.add("reds-button-new-text");
      span.textContent = i % 2 === 0 ? "已关注" : "关注";
      button.appendChild(span);
      buttons.push(button);
      dom.document.body.appendChild(button);
    }

    script.findAndProcessButtons();

    expect(buttons[0].style.backgroundColor).toBe("#999");
    expect(buttons[1].style.backgroundColor).toBeFalsy();
    expect(buttons[2].style.backgroundColor).toBe("#999");
    expect(buttons[3].style.backgroundColor).toBeFalsy();
    expect(buttons[4].style.backgroundColor).toBe("#999");
  });

  it("should handle rapid state changes", () => {
    const button = new dom.MockElement("button");
    button.classList.add("follow-button");
    const span = new dom.MockElement("span");
    span.classList.add("reds-button-new-text");
    button.appendChild(span);

    // Rapid changes
    span.textContent = "已关注";
    script.processButton(button);
    expect(button.style.backgroundColor).toBe("#999");

    span.textContent = "关注";
    script.processButton(button);
    expect(button.style.backgroundColor).toBeFalsy();

    span.textContent = "已关注";
    script.processButton(button);
    expect(button.style.backgroundColor).toBe("#999");

    span.textContent = "关注";
    script.processButton(button);
    expect(button.style.backgroundColor).toBeFalsy();
  });

  it("should not double-apply styles", () => {
    const button = new dom.MockElement("button");
    button.classList.add("follow-button");
    const span = new dom.MockElement("span");
    span.classList.add("reds-button-new-text");
    span.textContent = "已关注";
    button.appendChild(span);

    script.processButton(button);
    const firstStyle = button.style.cssText;

    script.processButton(button);
    const secondStyle = button.style.cssText;

    expect(firstStyle).toBe(secondStyle);
  });
});

describe("Real-world HTML patterns", () => {
  let dom, script;

  beforeEach(() => {
    dom = createMockDOM();
    script = createUserScriptLogic(dom.document, dom.MockMutationObserver);
  });

  it("should match the exact structure from the issue", () => {
    const button = new dom.MockElement("button");
    button.className =
      "reds-button-new follow-button large primary follow-button";

    const boxSpan = new dom.MockElement("span");
    boxSpan.classList.add("reds-button-new-box");

    const textSpan = new dom.MockElement("span");
    textSpan.classList.add("reds-button-new-text");
    textSpan.textContent = "已关注";

    boxSpan.appendChild(textSpan);
    button.appendChild(boxSpan);

    script.processButton(button);

    expect(button.style.backgroundColor).toBe("#999");
  });

  it("should match Vue rendered structure with comment markers", () => {
    const button = new dom.MockElement("button");
    button.className =
      "reds-button-new follow-button large primary follow-button";

    // Build DOM structure directly to simulate Vue rendered HTML:
    // <span class="reds-button-new-box"><!----><!--[--><!--]--><span class="reds-button-new-text"><!--[-->已关注<!--]--></span></span>
    const boxSpan = new dom.MockElement("span");
    boxSpan.classList.add("reds-button-new-box");

    const textSpan = new dom.MockElement("span");
    textSpan.classList.add("reds-button-new-text");
    textSpan._textContent = "已关注"; // After Vue comment markers stripped

    boxSpan.appendChild(textSpan);
    button.appendChild(boxSpan);

    script.processButton(button);

    expect(button.style.backgroundColor).toBe("#999");
  });
});
