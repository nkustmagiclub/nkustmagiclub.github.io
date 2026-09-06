(function () {
  "use strict";

  const PAGE_KIND = document.body.dataset.page || "home";
  const CONTENT_FILE = document.body.dataset.contentFile || "EDIT_CONTENT.md";
  const PAGE_KICKER = document.body.dataset.kicker || "02 / ABOUT";
  const PAGE_VERSION = "20260906-natural-photo";
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

  function findImages(tokens) {
    if (!Array.isArray(tokens)) return [];

    const images = [];

    tokens.forEach((token) => {
      if (!token) return;

      if (token.type === "image") {
        images.push({
          src: String(token.href || "").trim(),
          alt: String(token.text || "").trim(),
        });
        return;
      }

      images.push(...findImages(token.tokens));
    });

    return images;
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
          images: [],
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
          images: [],
          links: [],
        };
        currentSection.items.push(currentItem);
        return;
      }

      if (token.type === "paragraph") {
        const images = findImages(token.tokens);

        if (currentSection && images.length > 0) {
          if (currentItem) currentItem.images.push(...images);
          else currentSection.images.push(...images);
          return;
        }

        const text = plainText(token.tokens) || token.text.trim();
        if (!text) return;

        if (currentItem) currentItem.paragraphs.push(text);
        else if (currentSection) currentSection.paragraphs.push(text);
        else page.intro.push(text);
        return;
      }

      if (token.type === "list" && currentSection) {
        const links = currentItem ? currentItem.links : currentSection.links;

        token.items.forEach((item) => {
          const link = findLink(item.tokens);
          if (!link) {
            const label = plainText(item.tokens) || String(item.text || "").trim();

            if (label) {
              links.push({
                label,
                href: "",
              });
            }
            return;
          }

          const label = plainText(link.tokens) || link.text || "前往連結";
          links.push({
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

  function pageContainer(extraClasses = "") {
    return element(
      "div",
      ["container-fluid", extraClasses].filter(Boolean).join(" ")
    );
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

      if (!external && url.pathname.toLowerCase().endsWith(".html")) {
        url.searchParams.set("v", PAGE_VERSION);
      }

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
      const match = url.pathname.match(/^\/(p|reel|tv)\/([^/]+)/);

      if (
        !["instagram.com", "www.instagram.com"].includes(hostname) ||
        !match
      ) {
        return null;
      }

      return `https://www.instagram.com/${match[1]}/${match[2]}/embed/`;
    } catch (_error) {
      return null;
    }
  }

  function normalizeImageSource(rawSrc) {
    try {
      const url = new URL(rawSrc, window.location.href);
      if (!["http:", "https:"].includes(url.protocol)) return null;

      if (url.origin === window.location.origin) {
        url.searchParams.set("v", PAGE_VERSION);
      }

      return url.href;
    } catch (_error) {
      return null;
    }
  }

  function buildContentImage(image) {
    const src = normalizeImageSource(image.src);
    if (!src) return null;

    const figure = element("figure", "detail-image-figure");
    const node = element("img", "detail-image");
    node.alt = image.alt || "活動圖片";
    node.loading = "lazy";
    node.decoding = "async";
    node.src = src;
    figure.appendChild(node);
    return figure;
  }

  function buildInstagramEmbed(link) {
    const shell = element("div", "instagram-embed-shell");
    const frame = element(
      "blockquote",
      "instagram-media instagram-embed-frame"
    );
    const fallback = element(
      "a",
      "instagram-embed-fallback",
      "若貼文未顯示，前往 Instagram 查看 ↗"
    );

    frame.setAttribute("data-instgrm-permalink", link.href);
    frame.setAttribute("data-instgrm-version", "14");
    frame.setAttribute("aria-label", link.label || "Instagram 貼文");

    fallback.href = link.href;
    fallback.target = "_blank";
    fallback.rel = "noopener noreferrer";

    shell.appendChild(frame);
    shell.appendChild(fallback);
    return shell;
  }

  function activateInstagramEmbeds() {
    if (!app.querySelector(".instagram-media")) return;

    const processEmbeds = () => {
      if (window.instgrm && window.instgrm.Embeds) {
        window.instgrm.Embeds.process();
      }
    };

    if (window.instgrm && window.instgrm.Embeds) {
      processEmbeds();
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://www.instagram.com/embed.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", processEmbeds, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.instagram.com/embed.js";
    script.referrerPolicy = "strict-origin-when-cross-origin";
    script.addEventListener("load", processEmbeds, { once: true });
    document.body.appendChild(script);
  }

  function buildHero(page) {
    const hero = element(
      "header",
      "site-hero d-flex align-items-center py-4 py-lg-5"
    );
    const container = pageContainer("position-relative");
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
    const hero = element(
      "header",
      "about-hero d-flex align-items-center py-4 py-lg-5"
    );
    const container = pageContainer();
    const navigation = element("nav", "about-navigation");
    const backLink = element("a", "about-back-link", "← 回首頁");

    backLink.href = `index.html?v=${PAGE_VERSION}`;
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
    const column = element("div", "col-12");
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
    const container = pageContainer();
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
      const row = element("div", "row gx-3 gx-lg-4 link-list");
      section.links.forEach((link) => row.appendChild(buildLinkCard(link)));
      container.appendChild(row);
    }

    wrapper.appendChild(container);
    return wrapper;
  }

  function buildAboutSection(section, index) {
    const wrapper = element("section", "about-content-section");
    const container = pageContainer();

    if (section.paragraphs.length > 1) {
      container.classList.add("multi-paragraph-section");
    }

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

        item.images.forEach((image) => {
          const figure = buildContentImage(image);

          if (figure) {
            figure.classList.add("experience-image-figure");
            article.classList.add("experience-item-with-image");
            article.appendChild(figure);
          }
        });

        const itemInstagramLinks = item.links.filter((link) =>
          instagramEmbedUrl(link.href)
        );
        const itemRegularLinks = item.links.filter(
          (link) => !itemInstagramLinks.includes(link)
        );

        itemInstagramLinks.forEach((link) => {
          const embed = buildInstagramEmbed(link);
          embed.classList.add("experience-instagram-embed");
          article.appendChild(embed);
        });

        if (itemRegularLinks.length > 0) {
          const row = element("div", "row gx-3 link-list experience-link-row");
          itemRegularLinks.forEach((link) => row.appendChild(buildLinkCard(link)));
          article.appendChild(row);
        }

        grid.appendChild(article);
      });

      container.appendChild(grid);
    }

    section.images.forEach((image) => {
      const figure = buildContentImage(image);
      if (figure) container.appendChild(figure);
    });

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
      const row = element("div", "row gx-3 gx-lg-4 link-list");
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
    activateInstagramEmbeds();
  }

  function renderError() {
    const section = element("section", "error-state container-fluid py-3");
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
