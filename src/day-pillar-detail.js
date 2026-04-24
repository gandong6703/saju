import rawDayPillarText from "./일주풀이.txt?raw";
import rawYearPillarText from "./년주풀이.txt?raw";
import rawMonthPillarText from "./월주풀이.txt?raw";
import rawHourPillarText from "./시주풀이.txt?raw";

const DEFAULT_TYPE = "day";
const NOT_READY_MESSAGE = "해당 사주는 준비 중입니다";
const SECTION2_ICONS = [
  "auto_awesome",
  "styler",
  "psychology",
  "bolt",
  "architecture",
  "military_tech"
];

const PILLAR_TYPE_CONFIG = {
  day: {
    korean: "일주",
    english: "DAY PILLAR",
    badgeTitle: "일주 (DAY PILLAR): 자아와 본질",
    badgeSubtitle: "나라는 사람의 성격과 삶을 대하는 핵심 태도",
    cardTitle: "나의 일주 카드",
    adviceHeading: "오래도록 빛나기 위하여",
    source: rawDayPillarText
  },
  month: {
    korean: "월주",
    english: "MONTH PILLAR",
    badgeTitle: "월주 (MONTH PILLAR): 사회와 환경",
    badgeSubtitle: "내가 발을 딛고 서 있는 직업과 사회적 무대",
    cardTitle: "나의 월주 카드",
    adviceHeading: "거친 바람 속에서도 우아하게 춤추기 위하여",
    source: rawMonthPillarText
  },
  year: {
    korean: "년주",
    english: "YEAR PILLAR",
    badgeTitle: "년주 (YEAR PILLAR): 뿌리와 근본",
    badgeSubtitle: "나의 태생과 조상의 기운이 담긴 시작점",
    cardTitle: "나의 년주 카드",
    adviceHeading: "깊고 단단하게 뿌리내리기 위하여",
    source: rawYearPillarText
  },
  hour: {
    korean: "시주",
    english: "HOUR PILLAR",
    badgeTitle: "시주 (HOUR PILLAR): 결실과 심연",
    badgeSubtitle: "인생의 최종적인 결과와 보이지 않는 내면의 잠재력",
    cardTitle: "나의 시주 카드",
    adviceHeading: "당신이 다다를 아름다운 풍경을 위하여",
    source: rawHourPillarText
  }
};

const TYPE_ALIAS_MAP = {
  day: "day",
  month: "month",
  year: "year",
  hour: "hour",
  일주: "day",
  월주: "month",
  년주: "year",
  연주: "year",
  시주: "hour"
};
const TYPE_ORDER = ["hour", "day", "month", "year"];

function normalizeText(text) {
  return String(text ?? "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function parseHashtags(line) {
  if (!line || !line.startsWith("#")) {
    return [];
  }

  return line
    .split(",")
    .map((token) => normalizeText(token))
    .filter(Boolean)
    .map((token) => (token.startsWith("#") ? token : `#${token}`));
}

function parseHeader(line) {
  const cleaned = normalizeText(line);
  const match = cleaned.match(
    /^(.*?)\s*(년주|월주|일주|시주)\s*([가-힣]{2})\(([^)]+)\)\s*:\s*(.+)$/
  );

  if (!match) {
    return null;
  }

  return {
    emoji: normalizeText(match[1]),
    pillarTypeKorean: normalizeText(match[2]),
    pillarHangul: normalizeText(match[3]),
    pillarHanja: normalizeText(match[4]),
    summary: normalizeText(match[5])
  };
}

function parsePillarBook(source) {
  const normalizedSource = String(source ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\[[^\]]*풀이\]/g, "");

  const rawBlocks = normalizedSource
    .split(/\n\s*-{5,}\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);

  const map = new Map();

  rawBlocks.forEach((block) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (!lines.length) {
      return;
    }

    const header = parseHeader(lines[0]);
    if (!header) {
      return;
    }

    const sectionStartIndexes = [];
    lines.forEach((line, index) => {
      if (/^\d+\.\s+/.test(line)) {
        sectionStartIndexes.push(index);
      }
    });

    if (!sectionStartIndexes.length) {
      return;
    }

    const intro = normalizeText(lines.slice(1, sectionStartIndexes[0]).join(" "));
    const sections = new Map();
    let hashtags = [];

    for (let i = 0; i < sectionStartIndexes.length; i += 1) {
      const start = sectionStartIndexes[i];
      const end = sectionStartIndexes[i + 1] ?? lines.length;
      const titleLine = normalizeText(lines[start].replace(/^\d+\.\s*/, ""));
      const sectionNumber = Number((lines[start].match(/^(\d+)\./) ?? [])[1] ?? 0);
      const sectionLines = [];

      lines.slice(start + 1, end).forEach((line) => {
        const cleaned = normalizeText(line);
        if (!cleaned) {
          return;
        }
        if (cleaned.startsWith("#")) {
          hashtags = parseHashtags(cleaned);
          return;
        }
        sectionLines.push(cleaned);
      });

      sections.set(sectionNumber, {
        title: titleLine,
        lines: sectionLines
      });
    }

    if (!hashtags.length) {
      const maybeHashtagLine = [...lines]
        .reverse()
        .map((line) => normalizeText(line))
        .find((line) => line.startsWith("#"));

      hashtags = parseHashtags(maybeHashtagLine ?? "");
    }

    map.set(header.pillarHangul, {
      ...header,
      intro,
      hashtags,
      sections
    });
  });

  return map;
}

const PILLAR_BOOKS = {
  day: parsePillarBook(PILLAR_TYPE_CONFIG.day.source),
  month: parsePillarBook(PILLAR_TYPE_CONFIG.month.source),
  year: parsePillarBook(PILLAR_TYPE_CONFIG.year.source),
  hour: parsePillarBook(PILLAR_TYPE_CONFIG.hour.source)
};

function getDefaultSectionTitle(sectionNumber, typeKey) {
  if (sectionNumber === 1) {
    return "핵심 이미지";
  }
  if (sectionNumber === 2) {
    return "성향 포인트";
  }
  if (sectionNumber === 3) {
    if (typeKey === "year") {
      return "초년기 흐름 (0세 ~ 20세)";
    }
    if (typeKey === "month") {
      return "청년기 흐름 (20세 ~ 40세)";
    }
    if (typeKey === "hour") {
      return "말년기 흐름 (60세 이후)";
    }
    return "중년기 운세 (40세 ~ 60세)";
  }
  return "삶을 위한 조언";
}

function createFallbackEntry(typeKey, typeConfig, pillarHangul) {
  const sections = new Map();

  for (let sectionNo = 1; sectionNo <= 4; sectionNo += 1) {
    sections.set(sectionNo, {
      title: getDefaultSectionTitle(sectionNo, typeKey),
      lines: [NOT_READY_MESSAGE]
    });
  }

  return {
    emoji: "",
    pillarTypeKorean: typeConfig.korean,
    pillarHangul: pillarHangul ?? "",
    pillarHanja: "",
    summary: NOT_READY_MESSAGE,
    intro: NOT_READY_MESSAGE,
    hashtags: [],
    sections
  };
}

function normalizeEntry(entry, typeKey, typeConfig) {
  const sections = new Map();

  for (let sectionNo = 1; sectionNo <= 4; sectionNo += 1) {
    const existing = entry.sections?.get(sectionNo);
    const title = normalizeText(existing?.title || getDefaultSectionTitle(sectionNo, typeKey));
    const rawLines = Array.isArray(existing?.lines) ? existing.lines.map((line) => normalizeText(line)).filter(Boolean) : [];

    sections.set(sectionNo, {
      title,
      lines: rawLines.length > 0 ? rawLines : [NOT_READY_MESSAGE]
    });
  }

  return {
    emoji: normalizeText(entry.emoji),
    pillarTypeKorean: normalizeText(entry.pillarTypeKorean || typeConfig.korean),
    pillarHangul: normalizeText(entry.pillarHangul),
    pillarHanja: normalizeText(entry.pillarHanja),
    summary: normalizeText(entry.summary) || NOT_READY_MESSAGE,
    intro: normalizeText(entry.intro) || NOT_READY_MESSAGE,
    hashtags: Array.isArray(entry.hashtags) ? entry.hashtags.map((tag) => normalizeText(tag)).filter(Boolean) : [],
    sections
  };
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) {
    return;
  }

  el.textContent = value;
}

function clearChildren(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

function createTopTag(text) {
  const tag = document.createElement("span");
  tag.className =
    "bg-surface-container-lowest text-primary px-4 py-1.5 rounded-full text-sm font-body font-light tracking-wide border border-outline-variant/20 shadow-sm hover:border-secondary/30 hover:text-secondary transition-colors cursor-pointer";
  tag.textContent = text.startsWith("#") ? text : `#${text}`;
  return tag;
}

function createLegacyTag(text) {
  const tag = document.createElement("span");
  tag.className = "legacy-tag";
  tag.textContent = text.startsWith("#") ? text : `#${text}`;
  return tag;
}

function splitLeadAndBody(line) {
  const separatorIndex = line.indexOf(":");

  if (separatorIndex === -1) {
    return {
      lead: "",
      body: line
    };
  }

  return {
    lead: normalizeText(line.slice(0, separatorIndex)),
    body: normalizeText(line.slice(separatorIndex + 1))
  };
}

function extractLegacyTags(input, limit = 3) {
  const source = String(input ?? "");
  const tags = [];

  function pushToken(token) {
    const cleaned = normalizeText(token)
      .replace(/[“”"'‘’]/g, "")
      .replace(/^[^가-힣0-9A-Za-z]+|[^가-힣0-9A-Za-z]+$/g, "")
      .replace(/\s+/g, "");

    if (!cleaned) {
      return;
    }
    if (cleaned.length < 2 || cleaned.length > 12) {
      return;
    }
    if (/\d/.test(cleaned)) {
      return;
    }
    if (!/[가-힣]/.test(cleaned)) {
      return;
    }
    if (!tags.includes(cleaned)) {
      tags.push(cleaned);
    }
  }

  for (const match of source.matchAll(/\(([^()]{1,24})\)/g)) {
    match[1]
      .split(/[\/,·]/g)
      .map((piece) => piece.trim())
      .filter(Boolean)
      .forEach(pushToken);
  }

  for (const match of source.matchAll(/[‘'"]([^’'"]{1,24})[’'"]/g)) {
    pushToken(match[1]);
  }

  return tags.slice(0, limit).map((token) => `#${token}`);
}

function renderTopHashtags(hashtags) {
  const container = document.getElementById("detail-top-hashtags");
  if (!container) {
    return;
  }

  clearChildren(container);

  if (!Array.isArray(hashtags) || hashtags.length === 0) {
    return;
  }

  hashtags.forEach((tag) => {
    container.appendChild(createTopTag(tag));
  });
}

function renderSection1(section) {
  const title = section?.title ?? "핵심 이미지";
  const lines = section?.lines ?? [];
  setText("detail-section1-title", title);

  const list = document.getElementById("detail-section1-items");
  if (list) {
    clearChildren(list);

    lines.forEach((line) => {
      const { lead, body } = splitLeadAndBody(line);
      const li = document.createElement("li");
      li.className = "flex items-start gap-4";

      const icon = document.createElement("span");
      icon.className =
        "material-symbols-outlined text-secondary mt-1 text-lg opacity-80";
      icon.style.fontVariationSettings = "'FILL' 1";
      icon.textContent = "fiber_manual_record";

      const text = document.createElement("span");
      text.className = "break-keep";

      if (lead) {
        const strong = document.createElement("strong");
        strong.className = "text-on-background font-medium";
        strong.textContent = `${lead}:`;
        text.appendChild(strong);
        text.appendChild(document.createTextNode(` ${body}`));
      } else {
        text.textContent = body;
      }

      li.appendChild(icon);
      li.appendChild(text);
      list.appendChild(li);
    });
  }

  const tagContainer = document.getElementById("detail-section1-tags");
  if (tagContainer) {
    clearChildren(tagContainer);
    const tags = extractLegacyTags(`${title} ${lines.join(" ")}`, 2);
    tags.forEach((tag) => {
      tagContainer.appendChild(createLegacyTag(tag));
    });
  }
}

function renderSection2(section) {
  const title = section?.title ?? "성향 포인트";
  const lines = section?.lines ?? [];
  setText("detail-section2-title", title);

  const topTags = document.getElementById("detail-section2-tags");
  if (topTags) {
    clearChildren(topTags);
    const tags = extractLegacyTags(`${title} ${lines.join(" ")}`, 3);
    tags.forEach((tag) => {
      topTags.appendChild(createLegacyTag(tag));
    });
  }

  const cards = document.getElementById("detail-section2-cards");
  if (!cards) {
    return;
  }

  clearChildren(cards);

  lines.forEach((line, index) => {
    const { lead, body } = splitLeadAndBody(line);
    const card = document.createElement("div");
    card.className =
      "bg-surface-container-lowest rounded-[2rem] p-8 md:p-10 shadow-[0_10px_40px_rgb(0,0,0,0.03)] border border-outline-variant/10 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300";

    const iconWrap = document.createElement("div");
    iconWrap.className =
      "w-14 h-14 bg-surface-container-low text-secondary rounded-2xl flex items-center justify-center mb-6 border border-secondary/10";

    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined text-2xl";
    icon.style.fontVariationSettings = "'FILL' 1";
    icon.style.fontWeight = "300";
    icon.textContent = SECTION2_ICONS[index % SECTION2_ICONS.length];
    iconWrap.appendChild(icon);

    const heading = document.createElement("h3");
    heading.className =
      "display-text text-xl font-semibold text-on-background mb-3 tracking-wide";
    heading.textContent = lead || `성향 포인트 ${index + 1}`;

    const cardTags = extractLegacyTags(line, 1);
    const tagWrap = document.createElement("div");
    tagWrap.className = "mb-4";
    if (cardTags.length > 0) {
      tagWrap.appendChild(createLegacyTag(cardTags[0]));
    }

    const desc = document.createElement("p");
    desc.className =
      "font-body text-on-surface-variant leading-loose font-light text-base break-keep";
    desc.textContent = body || line;

    card.appendChild(iconWrap);
    card.appendChild(heading);
    card.appendChild(tagWrap);
    card.appendChild(desc);
    cards.appendChild(card);
  });
}

function renderSection3(section) {
  const title = section?.title ?? "인생 흐름";
  const lines = section?.lines ?? [];
  setText("detail-section3-title", title);

  const container = document.getElementById("detail-section3-items");
  if (!container) {
    return;
  }

  clearChildren(container);

  lines.forEach((line) => {
    const { lead, body } = splitLeadAndBody(line);
    const block = document.createElement("div");
    block.className = "border-l-[3px] border-secondary/40 pl-6 py-1";

    const heading = document.createElement("strong");
    heading.className =
      "display-text text-on-background font-medium block mb-2 text-xl tracking-wide";
    heading.textContent = lead || "핵심 포인트";

    const desc = document.createElement("p");
    desc.className = "leading-loose break-keep";
    desc.textContent = body || line;

    block.appendChild(heading);
    block.appendChild(desc);
    container.appendChild(block);
  });
}

function renderAdvice(section) {
  const adviceText = normalizeText(section?.lines?.join(" ") ?? "");
  if (!adviceText) {
    setText("detail-advice-text", NOT_READY_MESSAGE);
    return;
  }

  setText("detail-advice-text", `"${adviceText}"`);
}

function applyCardImages(pillarHangul, pillarTypeKorean) {
  const imagePath = pillarHangul ? `/images/${pillarHangul}.png` : "";
  const videoPath = pillarHangul ? `/videos/${pillarHangul}.mp4` : "";
  const cardImage = document.getElementById("detail-card-image");
  const modalImage = document.getElementById("detail-modal-image");
  const modalVideo = document.getElementById("detail-modal-video");

  if (cardImage) {
    if (imagePath) {
      cardImage.style.display = "";
      cardImage.src = imagePath;
      cardImage.alt = `${pillarTypeKorean} 카드`;
      cardImage.onerror = () => {
        cardImage.removeAttribute("src");
        cardImage.style.display = "none";
      };
    } else {
      cardImage.removeAttribute("src");
      cardImage.style.display = "none";
    }
  }

  if (modalImage) {
    if (imagePath) {
      modalImage.style.display = "";
      modalImage.src = imagePath;
      modalImage.alt = `${pillarTypeKorean} 카드 확대`;
      modalImage.onerror = () => {
        modalImage.removeAttribute("src");
        modalImage.style.display = "none";
      };
    } else {
      modalImage.removeAttribute("src");
      modalImage.style.display = "none";
    }
  }

  if (modalVideo) {
    modalVideo.dataset.ready = "false";
    modalVideo.classList.add("hidden");
    modalVideo.pause();
    modalVideo.currentTime = 0;

    if (!videoPath) {
      modalVideo.removeAttribute("src");
      return;
    }

    modalVideo.onloadeddata = () => {
      modalVideo.dataset.ready = "true";
    };
    modalVideo.onerror = () => {
      modalVideo.dataset.ready = "false";
      modalVideo.removeAttribute("src");
    };
    modalVideo.src = videoPath;
    modalVideo.load();
  }
}

function normalizeType(rawType) {
  const cleaned = normalizeText(rawType).toLowerCase();

  if (TYPE_ALIAS_MAP[cleaned]) {
    return TYPE_ALIAS_MAP[cleaned];
  }

  if (cleaned.includes("year") || cleaned.includes("년") || cleaned.includes("연")) {
    return "year";
  }
  if (cleaned.includes("month") || cleaned.includes("월")) {
    return "month";
  }
  if (cleaned.includes("hour") || cleaned.includes("시")) {
    return "hour";
  }
  if (cleaned.includes("day") || cleaned.includes("일")) {
    return "day";
  }

  return DEFAULT_TYPE;
}

function parseQueryType() {
  const params = new URLSearchParams(window.location.search);
  return normalizeType(params.get("type") ?? params.get("pillarType") ?? "");
}

function parseQueryPillar() {
  const params = new URLSearchParams(window.location.search);
  return normalizeText(params.get("pillar") ?? params.get("dayPillar") ?? "");
}

function parsePillarContext() {
  const params = new URLSearchParams(window.location.search);
  return {
    hour: normalizeText(params.get("hour") ?? ""),
    day: normalizeText(params.get("day") ?? params.get("dayPillar") ?? ""),
    month: normalizeText(params.get("month") ?? ""),
    year: normalizeText(params.get("year") ?? "")
  };
}

function parseResultQueryContext() {
  const params = new URLSearchParams(window.location.search);
  return {
    name: normalizeText(params.get("name") ?? ""),
    hanjaName: normalizeText(params.get("hanjaName") ?? ""),
    birthDate: normalizeText(params.get("birthDate") ?? ""),
    gender: normalizeText(params.get("gender") ?? ""),
    calendarType: normalizeText(params.get("calendarType") ?? params.get("calendar_type") ?? ""),
    timeBranch: normalizeText(params.get("timeBranch") ?? params.get("time_branch") ?? "")
  };
}

function buildDetailUrl(typeKey, pillar, pillarContext, resultContext) {
  const params = new URLSearchParams();
  params.set("type", typeKey);
  if (pillar) {
    params.set("pillar", pillar);
  }

  Object.entries(pillarContext).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  Object.entries(resultContext).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return `/dayPillar.html?${params.toString()}`;
}

function buildResultUrl(resultContext) {
  const params = new URLSearchParams();

  Object.entries(resultContext).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `/result.html?${query}` : "/result.html";
}

function setupBackNavigation(resultContext) {
  const backButton = document.getElementById("detail-back-button");
  if (!backButton) {
    return;
  }

  const hasContext = Object.values(resultContext).some(Boolean);
  const targetUrl = buildResultUrl(resultContext);

  backButton.onclick = () => {
    if (hasContext) {
      window.location.href = targetUrl;
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = targetUrl;
  };
}

function setupSideNavigation(currentType, context, currentPillar, resultContext) {
  const prevBtn = document.getElementById("detail-prev-nav");
  const nextBtn = document.getElementById("detail-next-nav");
  const prevLabel = document.getElementById("detail-prev-label");
  const nextLabel = document.getElementById("detail-next-label");

  if (!prevBtn || !nextBtn || !prevLabel || !nextLabel) {
    return;
  }

  const currentIndex = TYPE_ORDER.indexOf(currentType);
  const safeIndex = currentIndex >= 0 ? currentIndex : TYPE_ORDER.indexOf(DEFAULT_TYPE);
  const prevType = safeIndex > 0 ? TYPE_ORDER[safeIndex - 1] : null;
  const nextType = safeIndex < TYPE_ORDER.length - 1 ? TYPE_ORDER[safeIndex + 1] : null;

  const normalizedContext = { ...context };
  if (!normalizedContext[currentType] && currentPillar) {
    normalizedContext[currentType] = currentPillar;
  }

  if (prevType) {
    const prevPillar = normalizedContext[prevType] || currentPillar || "";
    prevLabel.textContent = PILLAR_TYPE_CONFIG[prevType].korean;
    prevBtn.onclick = () => {
      window.location.href = buildDetailUrl(prevType, prevPillar, normalizedContext, resultContext);
    };
    prevBtn.setAttribute("aria-label", `${PILLAR_TYPE_CONFIG[prevType].korean} 보기`);
    prevBtn.classList.remove("hidden");
  } else {
    prevBtn.onclick = null;
    prevBtn.classList.add("hidden");
  }

  if (nextType) {
    const nextPillar = normalizedContext[nextType] || currentPillar || "";
    nextLabel.textContent = PILLAR_TYPE_CONFIG[nextType].korean;
    nextBtn.onclick = () => {
      window.location.href = buildDetailUrl(nextType, nextPillar, normalizedContext, resultContext);
    };
    nextBtn.setAttribute("aria-label", `${PILLAR_TYPE_CONFIG[nextType].korean} 보기`);
    nextBtn.classList.remove("hidden");
  } else {
    nextBtn.onclick = null;
    nextBtn.classList.add("hidden");
  }
}

function renderDetail(entry, typeKey, typeConfig) {
  const label = entry.pillarHanja
    ? `${typeConfig.korean} ${entry.pillarHangul}(${entry.pillarHanja})`
    : entry.pillarHangul
      ? `${typeConfig.korean} ${entry.pillarHangul}`
      : typeConfig.korean;

  setText(
    "detail-pillar-type-badge",
    typeConfig.badgeTitle ?? `${typeConfig.korean} (${typeConfig.english})`
  );
  setText("detail-pillar-type-sub", typeConfig.badgeSubtitle ?? "");
  if (document.getElementById("detail-card-section-title-text")) {
    setText("detail-card-section-title-text", typeConfig.cardTitle);
  } else {
    setText("detail-card-section-title", typeConfig.cardTitle);
  }
  setText("detail-day-label", label);
  setText("detail-main-caption", entry.summary);
  setText("detail-card-highlight", entry.summary);
  setText("detail-intro-text", entry.intro);
  setText("detail-advice-heading", typeConfig.adviceHeading ?? "오래도록 빛나기 위하여");

  if (entry.emoji) {
    document.title = `${entry.emoji} ${label} 분석`;
  } else {
    document.title = `${label} 분석`;
  }

  applyCardImages(entry.pillarHangul, typeConfig.korean);
  renderTopHashtags(entry.hashtags);
  renderSection1(entry.sections.get(1));
  renderSection2(entry.sections.get(2));
  renderSection3(entry.sections.get(3));
  renderAdvice(entry.sections.get(4));
}

function revealMainContent() {
  const mainEl = document.getElementById("detail-main");
  if (!mainEl) {
    return;
  }
  mainEl.classList.remove("opacity-0");
}

function init() {
  try {
    const typeKey = parseQueryType();
    const typeConfig = PILLAR_TYPE_CONFIG[typeKey] ?? PILLAR_TYPE_CONFIG[DEFAULT_TYPE];
    const pillarContext = parsePillarContext();
    const resultContext = parseResultQueryContext();
    const requestedPillar = parseQueryPillar();
    const resolvedPillar = requestedPillar || pillarContext[typeKey] || "";
    const book = PILLAR_BOOKS[typeKey] ?? new Map();

    let selectedEntry = resolvedPillar ? book.get(resolvedPillar) : undefined;

    if (!selectedEntry) {
      selectedEntry = createFallbackEntry(typeKey, typeConfig, resolvedPillar);
    }

    const normalized = normalizeEntry(selectedEntry, typeKey, typeConfig);
    const finalEntry = {
      ...normalized,
      pillarHangul:
        normalized.pillarHangul ||
        resolvedPillar
    };

    renderDetail(finalEntry, typeKey, typeConfig);
    setupBackNavigation(resultContext);
    setupSideNavigation(typeKey, pillarContext, finalEntry.pillarHangul, resultContext);
  } finally {
    revealMainContent();
  }
}

init();
