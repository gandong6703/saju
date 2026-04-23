import { resolve } from "node:path";
import { Lunar, Solar } from "lunar-javascript";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const STEM_TO_KOREAN = {
  甲: "갑",
  乙: "을",
  丙: "병",
  丁: "정",
  戊: "무",
  己: "기",
  庚: "경",
  辛: "신",
  壬: "임",
  癸: "계"
};

const BRANCH_TO_KOREAN = {
  子: "자",
  丑: "축",
  寅: "인",
  卯: "묘",
  辰: "진",
  巳: "사",
  午: "오",
  未: "미",
  申: "신",
  酉: "유",
  戌: "술",
  亥: "해"
};

const ELEMENT_BY_CHAR = {
  甲: "wood",
  乙: "wood",
  寅: "wood",
  卯: "wood",
  丙: "fire",
  丁: "fire",
  巳: "fire",
  午: "fire",
  戊: "earth",
  己: "earth",
  丑: "earth",
  辰: "earth",
  未: "earth",
  戌: "earth",
  庚: "metal",
  辛: "metal",
  申: "metal",
  酉: "metal",
  壬: "water",
  癸: "water",
  子: "water",
  亥: "water"
};

const BRANCH_TO_HOUR = {
  unknown: 12,
  ja: 23,
  chuk: 1,
  in: 3,
  myo: 5,
  jin: 7,
  sa: 9,
  o: 11,
  mi: 13,
  sin: 15,
  yu: 17,
  sul: 19,
  hae: 21
};

function pad2(value) {
  return String(value).padStart(2, "0");
}

function parseBirthDate(birthDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate ?? "");
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function pillarToKorean(pillar) {
  const chars = [...(pillar ?? "")];
  if (chars.length < 2) {
    return pillar ?? "";
  }

  const stem = STEM_TO_KOREAN[chars[0]] ?? chars[0];
  const branch = BRANCH_TO_KOREAN[chars[1]] ?? chars[1];
  return `${stem}${branch}`;
}

function getElementCounts(pillarValues) {
  const counts = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0
  };

  Object.values(pillarValues).forEach((pillar) => {
    [...pillar].forEach((char) => {
      const element = ELEMENT_BY_CHAR[char];
      if (element) {
        counts[element] += 1;
      }
    });
  });

  return counts;
}

function buildManseResponse({ birthDate, calendarType, timeBranch }) {
  const parsed = parseBirthDate(birthDate);
  if (!parsed) {
    throw new Error("birthDate must be in YYYY-MM-DD format.");
  }

  const hour = BRANCH_TO_HOUR[timeBranch] ?? BRANCH_TO_HOUR.unknown;
  let solar;

  if (calendarType === "lunar") {
    const lunarInput = Lunar.fromYmdHms(
      parsed.year,
      parsed.month,
      parsed.day,
      hour,
      30,
      0
    );
    solar = lunarInput.getSolar();
  } else {
    solar = Solar.fromYmdHms(parsed.year, parsed.month, parsed.day, hour, 30, 0);
  }

  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  const pillarsHanja = {
    year: eightChar.getYear(),
    month: eightChar.getMonth(),
    day: eightChar.getDay(),
    hour: eightChar.getTime()
  };

  const pillars = {
    year: {
      hanja: pillarsHanja.year,
      hangul: pillarToKorean(pillarsHanja.year)
    },
    month: {
      hanja: pillarsHanja.month,
      hangul: pillarToKorean(pillarsHanja.month)
    },
    day: {
      hanja: pillarsHanja.day,
      hangul: pillarToKorean(pillarsHanja.day)
    },
    hour: {
      hanja: pillarsHanja.hour,
      hangul: pillarToKorean(pillarsHanja.hour)
    }
  };

  return {
    input: {
      birthDate,
      calendarType,
      timeBranch,
      calculatedHour: hour
    },
    solarDate: `${solar.getYear()}-${pad2(solar.getMonth())}-${pad2(solar.getDay())}`,
    lunarDate: `${lunar.getYear()}-${pad2(Math.abs(lunar.getMonth()))}-${pad2(
      lunar.getDay()
    )}`,
    pillars,
    elements: getElementCounts(pillarsHanja)
  };
}

function writeJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function manseApiHandler(req, res, next) {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (url.pathname !== "/api/manse") {
    next();
    return;
  }

  if (req.method !== "GET") {
    writeJson(res, 405, {
      ok: false,
      error: "Method not allowed."
    });
    return;
  }

  try {
    const birthDate = url.searchParams.get("birthDate") ?? "";
    const calendarType = url.searchParams.get("calendarType") ?? "solar";
    const timeBranch = url.searchParams.get("timeBranch") ?? "unknown";
    const result = buildManseResponse({
      birthDate,
      calendarType,
      timeBranch
    });

    writeJson(res, 200, {
      ok: true,
      result
    });
  } catch (error) {
    writeJson(res, 400, {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to calculate manse."
    });
  }
}

function manseApiPlugin() {
  return {
    name: "manse-api",
    configureServer(server) {
      server.middlewares.use(manseApiHandler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(manseApiHandler);
    }
  };
}

export default defineConfig({
  plugins: [react(), manseApiPlugin()],
  server: {
    open: "/main.html"
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        main: resolve(__dirname, "main.html"),
        result: resolve(__dirname, "result.html"),
        dayPillar: resolve(__dirname, "dayPillar.html")
      }
    }
  }
});
