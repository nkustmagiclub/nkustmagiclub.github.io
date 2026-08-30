(function () {
  "use strict";

  const CONTENT_FILE = "EDIT_CONTENT.md";
  const app = document.getElementById("app");

  function plainText(tokens) {
    if (!Array.isArray(tokens)) return "";

    return tokens
      .map((token) => {
        if (!token) return "";
        if (token.type === "br") return "\n";
        if (Array.isArray(token.tokens)) return plainText(token.tokens);
        if (typeof token.text === "string") return token.text;
        return "";
      })
      .join("")
      .trim();
  }

  function findLink(tokens) {
    if (!Array.isArray(tokens)) return null;

    for (const token of tokens) {
      if (!token) continue;
      if (token.type === "link") return token;

      const nested = findLink(token.tokens);
      if (nested) return nested;
    }

    return null;
  }

  function parseContent(markdown) {
    if (!window.marked || typeof window.marked.lexer !== "function") {
      throw new Error("Markdown parser is unavailable.");
    }

    const tokens = window.marked.lexer(markdown, {
      gfm: true,
      breaks: false,
    });

    const page = {
      title: "",
      subtitle: "",
      intro: [],
      sections: [],
    };

    let currentSection = null;

    tokens.forEach((token) => {
      if (token.type === "heading" && token.depth === 1 && !page.title) {
        page.title = plainText(token.tokens) || token.text.trim();
        return;
      }

      if (token.type === "heading" && token.depth === 2) {
        const heading = plainText(token.tokens) || token.text.trim();

        if (!page.subtitle && page.sections.length === 0 && currentSection === null) {
          page.subtitle = heading;
          return;
        }

        currentSection = {
          title: heading,
          paragraphs: [],
          links: [],
        };
        page.sections.push(currentSection);
        return;
      }

      if (token.type === "paragraph") {
        const text = plainText(token.tokens) || token.text.trim();
        if (!text) return;

        if (currentSection) currentSection.paragraphs.push(text);
        else page.intro.push(text);
        return;
      }

      if (token.type === "list" && currentSection) {
        token.items.forEach((item) => {
          const link = findLink(item.tokens);
          if (!link) return;

          const label = plainText(link.tokens) || link.text || "前往連結";
          currentSection.links.push({
            label: label.trim(),
            href: String(link.href || "").trim(),
          });
        });
      }
    });

    if (!page.title) {
      throw new Error("Missing level-one club title.");
    }

    return page;
  }

  function element(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (typeof text === "string") node.textContent = text;
    return node;
  }

  function appendParagraphs(parent, paragraphs, className) {
    paragraphs.forEach((text) => {
      parent.appendChild(element("p", className, text));
    });
  }

  function normalizeLink(rawHref) {
    try {
      const url = new URL(rawHref, window.location.href);
      const allowed = ["http:", "https:", "mailto:", "tel:"];

      if (!allowed.includes(url.protocol)) return null;

      return {
        href: url.href,
        external:
          ["http:", "https:"].includes(url.protocol) &&
          url.origin !== window.location.origin,
      };
    } catch (_error) {
      return null;
    }
  }

  function buildHero(page) {
    const hero = element("header", "site-hero");
    const container = element("div", "container position-relative");
    const grid = element("div", "hero-grid");
    const copy = element("div", "hero-copy");

    copy.appendChild(
      element("p", "hero-kicker", "國立高雄科技大學・學生社團")
    );
    copy.appendChild(element("h1", "display-title", page.title));

    if (page.subtitle) {
      copy.appendChild(element("p", "hero-subtitle", page.subtitle));
    }

    appendParagraphs(copy, page.intro, "hero-description");

    const art = element("figure", "hero-art mb-0");
    const image = element("img", "hero-image");
    image.alt = `${page.title}主視覺`;
    image.decoding = "async";

    const fallback = element("div", "hero-art-fallback");
    fallback.setAttribute("aria-hidden", "true");
    fallback.innerHTML =
      '<span class="magic-spark">✦</span><span class="card-shape card-one"></span><span class="card-shape card-two"></span>';

    image.addEventListener("load", () => {
      image.classList.add("is-ready");
      fallback.classList.add("d-none");
    });
    image.addEventListener("error", () => {
      image.remove();
    });
    image.src = "images/hero.jpg";

    art.appendChild(image);
    art.appendChild(fallback);
    grid.appendChild(copy);
    grid.appendChild(art);
    container.appendChild(grid);
    hero.appendChild(container);

    return hero;
  }

  function buildLinkCard(link) {
    const column = element("div", "col-12 col-md-6 col-xl-4");
    const safe = normalizeLink(link.href);

    if (!safe) {
      const disabled = element(
        "div",
        "link-card link-card-disabled h-100",
        link.label
      );
      disabled.setAttribute("aria-disabled", "true");
      column.appendChild(disabled);
      return column;
    }

    const anchor = element("a", "link-card h-100", link.label);
    anchor.href = safe.href;

    if (safe.external) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    }

    const arrow = element("span", "link-arrow", "↗");
    arrow.setAttribute("aria-hidden", "true");
    anchor.appendChild(arrow);
    column.appendChild(anchor);

    return column;
  }

  function buildSection(section, index) {
    const wrapper = element(
      "section",
      `content-section ${index % 2 === 1 ? "section-tinted" : ""}`
    );
    const container = element("div", "container");
    const headingRow = element("div", "section-heading");
    const sectionNumber = element(
      "span",
      "section-number",
      String(index + 1).padStart(2, "0")
    );

    sectionNumber.setAttribute("aria-hidden", "true");
    headingRow.appendChild(sectionNumber);
    headingRow.appendChild(element("h2", "section-title", section.title));
    container.appendChild(headingRow);
    appendParagraphs(container, section.paragraphs, "section-description");

    if (section.links.length > 0) {
      const row = element("div", "row g-3 g-lg-4 mt-2");
      section.links.forEach((link) => row.appendChild(buildLinkCard(link)));
      container.appendChild(row);
    }

    wrapper.appendChild(container);
    return wrapper;
  }

  function renderPage(page) {
    document.title = page.subtitle
      ? `${page.title}｜${page.subtitle}`
      : page.title;

    const fragment = document.createDocumentFragment();
    fragment.appendChild(buildHero(page));
    page.sections.forEach((section, index) => {
      fragment.appendChild(buildSection(section, index));
    });

    app.replaceChildren(fragment);
  }

  function renderError() {
    const section = element("section", "error-state container py-5");
    const card = element("div", "error-card");
    card.setAttribute("role", "alert");
    card.appendChild(element("p", "error-label", "內容暫時無法載入"));
    card.appendChild(
      element(
        "h1",
        "error-title",
        "網站沒有白屏，但需要請維護者看一下。"
      )
    );
    card.appendChild(
      element(
        "p",
        "error-description mb-0",
        "請稍後重新整理；若仍然出現這個畫面，請確認 EDIT_CONTENT.md 是否存在、檔名大小寫是否正確。"
      )
    );
    section.appendChild(card);
    app.replaceChildren(section);
  }

  async function start() {
    try {
      const response = await fetch(CONTENT_FILE, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Content request failed with ${response.status}.`);
      }

      const markdown = await response.text();
      renderPage(parseContent(markdown));
    } catch (error) {
      console.error("Unable to load site content.", error);
      renderError();
    }
  }

  start();
})();
