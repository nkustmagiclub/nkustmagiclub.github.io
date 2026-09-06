(function () {
  "use strict";

  const PAGE_KIND = document.body.dataset.page || "home";
  const CONTENT_FILE = document.body.dataset.contentFile || "EDIT_CONTENT.md";
  const PAGE_KICKER = document.body.dataset.kicker || "02 / ABOUT";
  const app = document.getElementById("app");
  const copyrightYear = document.getElementById("copyright-year");

  if (copyrightYear) {
    copyrightYear.textContent = String(new Date().getFullYear());
  }

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
    let currentItem = null;

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
          items: [],
        };
        currentItem = null;
        page.sections.push(currentSection);
        return;
      }

      if (token.type === "heading" && token.depth === 3 && currentSection) {
        const heading = plainText(token.tokens) || token.text.trim();
        currentItem = {
          title: heading,
          paragraphs: [],
        };
        currentSection.items.push(currentItem);
        return;
      }

      if (token.type === "paragraph") {
        const text = plainText(token.tokens) || token.text.trim();
        if (!text) return;

        if (currentItem) currentItem.paragraphs.push(text);
        else if (currentSection) currentSection.paragraphs.push(text);
        else page.intro.push(text);
        return;
      }

      if (token.type === "list" && currentSection) {
        token.items.forEach((item) => {
          const link = findLink(item.tokens);
          if (!link) {
            const label = plainText(item.tokens) || String(item.text || "").trim();

            if (label) {
              currentSection.links.push({
                label,
                href: "",
              });
            }
            return;
          }

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

      const external =
        ["http:", "https:"].includes(url.protocol) &&
        url.origin !== window.location.origin;

      return {
        href: url.href,
        newTab: external || url.pathname.toLowerCase().endsWith(".pdf"),
      };
    } catch (_error) {
      return null;
    }
  }

  function instagramEmbedUrl(rawHref) {
    try {
      const url = new URL(rawHref);
      const hostname = url.hostname.toLowerCase();
      const match = url.pathname.match(/^\/p\/([^/]+)/);

      if (
        !["instagram.com", "www.instagram.com"].includes(hostname) ||
        !match
      ) {
        return null;
      }

      return `https://www.instagram.com/p/${match[1]}/embed/`;
    } catch (_error) {
      return null;
    }
  }

  function buildInstagramEmbed(link) {
    const shell = element("div", "instagram-embed-shell");
    const frame = element("iframe", "instagram-embed-frame");
    const fallback = element(
      "a",
      "instagram-embed-fallback",
      "若貼文未顯示，前往 Instagram 查看 ↗"
    );

    frame.src = instagramEmbedUrl(link.href);
    frame.title = link.label || "學生會 Instagram 貼文";
    frame.loading = "lazy";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.setAttribute("allowfullscreen", "");

    fallback.href = link.href;
    fallback.target = "_blank";
    fallback.rel = "noopener noreferrer";

    shell.appendChild(frame);
    shell.appendChild(fallback);
    return shell;
  }

  function buildHero(page) {
    const hero = element("header", "site-hero");
    const container = element("div", "container position-relative");
    const grid = element("div", "hero-grid");
    const copy = element("div", "hero-copy");

    copy.appendChild(element("h1", "display-title", page.title));

    if (page.subtitle) {
      copy.appendChild(element("p", "hero-subtitle", page.subtitle));
    }

    if (page.intro.length > 0) {
      appendParagraphs(copy, page.intro, "hero-description");
    }

    grid.appendChild(copy);
    container.appendChild(grid);
    hero.appendChild(container);

    return hero;
  }

  function buildAboutHero(page) {
    const hero = element("header", "about-hero");
    const container = element("div", "container");
    const navigation = element("nav", "about-navigation");
    const backLink = element("a", "about-back-link", "← 回首頁");

    backLink.href = "index.html";
    backLink.setAttribute("aria-label", "返回高科大魔術社首頁");
    navigation.appendChild(backLink);
    container.appendChild(navigation);

    const heading = element("div", "about-heading");
    heading.appendChild(element("p", "about-kicker", PAGE_KICKER));
    heading.appendChild(element("h1", "about-title", page.title));

    if (page.subtitle) {
      heading.appendChild(element("p", "about-subtitle", page.subtitle));
    }

    if (page.intro.length > 0) {
      appendParagraphs(heading, page.intro, "about-intro");
    }

    container.appendChild(heading);
    hero.appendChild(container);
    return hero;
  }

  function buildLinkCard(link) {
    const column = element("div", "col-12 col-md-6 col-xl-4");
    const noticePrefix = "notice:";

    if (link.href.startsWith(noticePrefix)) {
      const message = link.href.slice(noticePrefix.length).trim();
      const anchor = element("a", "link-card h-100", link.label);
      anchor.href = "#";
      anchor.setAttribute("aria-label", `${link.label}；${message}`);
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        window.alert(message);
      });

      const noticeMark = element("span", "link-arrow", "!");
      noticeMark.setAttribute("aria-hidden", "true");
      anchor.appendChild(noticeMark);
      column.appendChild(anchor);
      return column;
    }

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

    if (safe.newTab) {
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

  function buildAboutSection(section, index) {
    const wrapper = element("section", "about-content-section");
    const container = element("div", "container");
    const headingRow = element("div", "section-heading about-section-heading");
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

    if (section.items.length > 0) {
      const grid = element("div", "experience-grid");

      section.items.forEach((item, itemIndex) => {
        const article = element("article", "experience-item");
        const number = element(
          "span",
          "experience-number",
          String(itemIndex + 1).padStart(2, "0")
        );
        const copy = element("div", "experience-copy");

        number.setAttribute("aria-hidden", "true");
        copy.appendChild(element("h3", "experience-title", item.title));
        appendParagraphs(copy, item.paragraphs, "experience-description");
        article.appendChild(number);
        article.appendChild(copy);
        grid.appendChild(article);
      });

      container.appendChild(grid);
    }

    const instagramLinks =
      PAGE_KIND === "event"
        ? section.links.filter((link) => instagramEmbedUrl(link.href))
        : [];
    const regularLinks = section.links.filter(
      (link) => !instagramLinks.includes(link)
    );

    instagramLinks.forEach((link) => {
      container.appendChild(buildInstagramEmbed(link));
    });

    if (regularLinks.length > 0) {
      const row = element("div", "row g-3 g-lg-4 mt-4");
      regularLinks.forEach((link) => row.appendChild(buildLinkCard(link)));
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
    if (PAGE_KIND === "about" || PAGE_KIND === "event") {
      fragment.appendChild(buildAboutHero(page));
      page.sections.forEach((section, index) => {
        fragment.appendChild(buildAboutSection(section, index));
      });
    } else {
      fragment.appendChild(buildHero(page));
      page.sections.forEach((section, index) => {
        fragment.appendChild(buildSection(section, index));
      });
    }

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
        `請稍後重新整理；若仍然出現這個畫面，請確認 ${CONTENT_FILE} 是否存在、檔名大小寫是否正確。`
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
