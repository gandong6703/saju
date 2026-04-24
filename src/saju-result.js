const nameEl = document.getElementById("result-name");
const subtitleEl = document.getElementById("result-subtitle");

const seasonalSummaryTextEl = document.getElementById("result-seasonal-summary-text");
const seasonalSummaryIconEl = document.getElementById("result-seasonal-summary-icon");

const pillarEls = {
  hour: document.getElementById("hour-pillar"),
  day: document.getElementById("day-pillar"),
  month: document.getElementById("month-pillar"),
  year: document.getElementById("year-pillar")
};

const PILLAR_META = {
  hour: { type: "hour", label: "시주" },
  day: { type: "day", label: "일주" },
  month: { type: "month", label: "월주" },
  year: { type: "year", label: "년주" }
};

const DAY_STEM_TO_LABEL = {
  갑: "자라난 나무",
  을: "피어난 꽃",
  병: "뜬 태양",
  정: "밝힌 등불",
  무: "솟아난 태산",
  기: "일구어진 비옥한 땅",
  경: "제련된 강철",
  신: "빛나는 보석",
  임: "찰랑이는 바다",
  계: "맺힌 이슬"
};

const MONTH_BRANCH_TO_SEASON = {
  자: "한겨울에",
  축: "늦겨울에",
  인: "초봄에",
  묘: "봄에",
  진: "늦봄에",
  사: "초여름에",
  오: "한여름에",
  미: "늦여름에",
  신: "초가을에",
  유: "가을에",
  술: "늦가을에",
  해: "초겨울에"
};

const DAY_STEM_TO_ICON = {
  갑: "park",
  을: "local_florist",
  병: "wb_sunny",
  정: "lightbulb",
  무: "terrain",
  기: "grass",
  경: "hardware",
  신: "diamond",
  임: "waves",
  계: "water_drop"
};

const pillarCards = {
  hour: pillarEls.hour?.closest("div.relative") ?? null,
  day: pillarEls.day?.closest("div.relative") ?? null,
  month: pillarEls.month?.closest("div.relative") ?? null,
  year: pillarEls.year?.closest("div.relative") ?? null
};

function formatCalendarLabel(calendarType) {
  return calendarType === "lunar" ? "음력 기준" : "양력 기준";
}

function getQueryParams() {
  const query = new URLSearchParams(window.location.search);
  return {
    name: query.get("name") ?? "",
    birthDate: query.get("birthDate") ?? "",
    calendarType: query.get("calendarType") ?? query.get("calendar_type") ?? "solar",
    timeBranch: query.get("timeBranch") ?? "unknown"
  };
}

function getDetailPassThroughParams() {
  const query = new URLSearchParams(window.location.search);
  return {
    name: query.get("name") ?? "",
    hanjaName: query.get("hanjaName") ?? "",
    birthDate: query.get("birthDate") ?? "",
    gender: query.get("gender") ?? "",
    calendarType: query.get("calendarType") ?? query.get("calendar_type") ?? "",
    timeBranch: query.get("timeBranch") ?? query.get("time_branch") ?? ""
  };
}

function getStemAndBranch(pillarHangul) {
  const chars = [...String(pillarHangul ?? "").trim()];
  return {
    stem: chars[0] ?? "",
    branch: chars[1] ?? ""
  };
}

function updateSeasonalSummary(pillars) {
  const day = getStemAndBranch(pillars?.day?.hangul ?? "");
  const month = getStemAndBranch(pillars?.month?.hangul ?? "");

  const dayLabel = DAY_STEM_TO_LABEL[day.stem];
  const seasonLabel = MONTH_BRANCH_TO_SEASON[month.branch];
  const iconName = DAY_STEM_TO_ICON[day.stem] ?? "auto_awesome";

  if (seasonalSummaryTextEl) {
    seasonalSummaryTextEl.textContent =
      dayLabel && seasonLabel ? `${seasonLabel} ${dayLabel}` : "사주의 흐름을 해석하는 중";
  }

  if (seasonalSummaryIconEl) {
    seasonalSummaryIconEl.textContent = iconName;
  }
}

function updateSeasonalSummaryFromCurrentPillars() {
  updateSeasonalSummary({
    day: { hangul: pillarEls.day?.textContent?.trim() ?? "" },
    month: { hangul: pillarEls.month?.textContent?.trim() ?? "" }
  });
}

function applyPillars(pillars) {
  pillarEls.hour.textContent = pillars.hour.hangul;
  pillarEls.day.textContent = pillars.day.hangul;
  pillarEls.month.textContent = pillars.month.hangul;
  pillarEls.year.textContent = pillars.year.hangul;
}

function applyElementCounts(elements) {
  const total = 8;

  Object.entries(elements).forEach(([element, count]) => {
    const countEl = document.querySelector(`[data-element-count="${element}"]`);
    const barEl = document.querySelector(`[data-element-bar="${element}"]`);

    if (countEl) {
      countEl.textContent = String(count);
    }

    if (barEl) {
      const clamped = Math.max(0, Math.min(total, Number(count) || 0));
      const percent = (clamped / total) * 100;
      barEl.style.height = `${percent}%`;
    }
  });
}

function applyPillarImages() {
  const imageEls = document.querySelectorAll("img[data-pillar-image]");
  const pillarsByOrder = [
    pillarEls.hour?.textContent?.trim() ?? "",
    pillarEls.day?.textContent?.trim() ?? "",
    pillarEls.month?.textContent?.trim() ?? "",
    pillarEls.year?.textContent?.trim() ?? ""
  ];

  imageEls.forEach((imgEl, index) => {
    const pillar = pillarsByOrder[index];

    if (!pillar) {
      imgEl.removeAttribute("src");
      imgEl.style.display = "none";
      return;
    }

    const imagePath = `/images/${pillar}.png`;
    const probe = new Image();

    probe.onload = () => {
      imgEl.src = imagePath;
      imgEl.style.display = "";
    };

    probe.onerror = () => {
      imgEl.removeAttribute("src");
      imgEl.style.display = "none";
    };

    probe.src = imagePath;
  });
}

function applyPillarVideos() {
  const imageEls = document.querySelectorAll("img[data-pillar-image]");
  const pillarsByOrder = [
    pillarEls.hour?.textContent?.trim() ?? "",
    pillarEls.day?.textContent?.trim() ?? "",
    pillarEls.month?.textContent?.trim() ?? "",
    pillarEls.year?.textContent?.trim() ?? ""
  ];

  imageEls.forEach((imgEl, index) => {
    const card = imgEl.closest("div.relative");
    if (!card) {
      return;
    }

    let videoEl = card.querySelector("video[data-pillar-video]");
    if (!videoEl) {
      videoEl = document.createElement("video");
      videoEl.dataset.pillarVideo = "true";
      videoEl.className =
        "absolute inset-0 h-full w-full object-cover object-center opacity-0 pointer-events-none transition-opacity duration-300";
      videoEl.muted = true;
      videoEl.loop = true;
      videoEl.playsInline = true;
      videoEl.preload = "metadata";
      imgEl.insertAdjacentElement("afterend", videoEl);
    }

    const pillar = pillarsByOrder[index];
    if (!pillar) {
      videoEl.pause();
      videoEl.removeAttribute("src");
      videoEl.dataset.ready = "false";
      videoEl.classList.add("opacity-0");
      return;
    }

    videoEl.pause();
    videoEl.currentTime = 0;
    videoEl.dataset.ready = "false";
    videoEl.classList.add("opacity-0");
    videoEl.onloadeddata = () => {
      videoEl.dataset.ready = "true";
    };
    videoEl.onerror = () => {
      videoEl.dataset.ready = "false";
      videoEl.removeAttribute("src");
    };
    videoEl.src = `/videos/${pillar}.mp4`;
    videoEl.load();

    card.onmouseenter = () => {
      if (videoEl.dataset.ready !== "true") {
        return;
      }
      videoEl.classList.remove("opacity-0");
      const playPromise = videoEl.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    };

    card.onmouseleave = () => {
      videoEl.classList.add("opacity-0");
      videoEl.pause();
      videoEl.currentTime = 0;
    };
  });
}

function moveToPillarDetail(cardEl) {
  if (!cardEl) {
    return;
  }

  const targetUrl = cardEl.dataset.targetUrl;
  if (targetUrl) {
    window.location.href = targetUrl;
  }
}

function bindPillarNavigation() {
  Object.values(pillarCards).forEach((cardEl) => {
    if (!cardEl || cardEl.dataset.navBound === "true") {
      return;
    }

    cardEl.addEventListener("click", () => {
      moveToPillarDetail(cardEl);
    });

    cardEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        moveToPillarDetail(cardEl);
      }
    });

    cardEl.dataset.navBound = "true";
  });
}

function updatePillarNavigation() {
  const passThroughParams = getDetailPassThroughParams();
  const pillarContext = {
    hour: pillarEls.hour?.textContent?.trim() ?? "",
    day: pillarEls.day?.textContent?.trim() ?? "",
    month: pillarEls.month?.textContent?.trim() ?? "",
    year: pillarEls.year?.textContent?.trim() ?? ""
  };

  Object.entries(PILLAR_META).forEach(([key, meta]) => {
    const cardEl = pillarCards[key];
    const pillarEl = pillarEls[key];

    if (!cardEl || !pillarEl) {
      return;
    }

    const pillar = pillarEl.textContent?.trim() ?? "";
    let targetUrl = "";

    if (pillar) {
      const query = new URLSearchParams();
      query.set("type", meta.type);
      query.set("pillar", pillar);

      Object.entries(pillarContext).forEach(([contextKey, contextValue]) => {
        if (contextValue) {
          query.set(contextKey, contextValue);
        }
      });

      Object.entries(passThroughParams).forEach(([contextKey, contextValue]) => {
        if (contextValue) {
          query.set(contextKey, contextValue);
        }
      });

      targetUrl = `/dayPillar.html?${query.toString()}`;
    }

    cardEl.dataset.targetUrl = targetUrl;

    if (targetUrl) {
      cardEl.classList.add("cursor-pointer");
      cardEl.setAttribute("role", "link");
      cardEl.setAttribute("tabindex", "0");
      cardEl.setAttribute("aria-label", `${pillar} ${meta.label} 상세 페이지로 이동`);
    } else {
      cardEl.classList.remove("cursor-pointer");
      cardEl.removeAttribute("role");
      cardEl.removeAttribute("tabindex");
      cardEl.removeAttribute("aria-label");
    }
  });
}

async function loadResult() {
  const params = getQueryParams();

  if (nameEl) {
    nameEl.textContent = params.name || "이름 미입력";
  }

  if (!params.birthDate) {
    if (subtitleEl) {
      subtitleEl.textContent = "생년월일 정보가 없어 결과를 계산할 수 없습니다.";
    }
    updateSeasonalSummaryFromCurrentPillars();
    applyPillarImages();
    applyPillarVideos();
    updatePillarNavigation();
    return;
  }

  if (subtitleEl) {
    subtitleEl.textContent = `${params.birthDate} ${formatCalendarLabel(params.calendarType)} 계산 중`;
  }

  try {
    const response = await fetch(
      `/api/manse?birthDate=${encodeURIComponent(params.birthDate)}&calendarType=${encodeURIComponent(
        params.calendarType
      )}&timeBranch=${encodeURIComponent(params.timeBranch)}`
    );
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "만세력 계산 API 호출에 실패했습니다.");
    }

    const result = data.result;
    applyPillars(result.pillars);
    updateSeasonalSummary(result.pillars);
    applyElementCounts(result.elements);
    applyPillarImages();
    applyPillarVideos();
    updatePillarNavigation();

    if (subtitleEl) {
      subtitleEl.textContent = `${result.solarDate} (양력) / ${result.lunarDate} (음력)`;
    }
  } catch (error) {
    if (subtitleEl) {
      subtitleEl.textContent =
        error instanceof Error
          ? error.message
          : "결과를 불러오는 중 오류가 발생했습니다.";
    }
    updateSeasonalSummaryFromCurrentPillars();
    applyPillarImages();
    applyPillarVideos();
    updatePillarNavigation();
  }
}

bindPillarNavigation();
updateSeasonalSummaryFromCurrentPillars();
loadResult();
