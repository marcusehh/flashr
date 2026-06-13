// Parse an Anki-style export (tab/comma/semicolon separated) into cards.
// Supports the optional header lines Anki writes, e.g.:
//   #separator:tab
//   #html:true
//   #tags column:3

const SEP_MAP = {
  tab: "\t",
  comma: ",",
  semicolon: ";",
  space: " ",
  pipe: "|",
};

export function parseCards(text) {
  const config = { separator: "\t", html: false, tagsColumn: 0 };
  const lines = text.split(/\r?\n/);
  const rows = [];

  for (const raw of lines) {
    if (raw.trim() === "") continue;

    if (raw.startsWith("#")) {
      const line = raw.slice(1);
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim().toLowerCase();
      const val = line.slice(idx + 1).trim();

      if (key === "separator") {
        config.separator = SEP_MAP[val.toLowerCase()] || val;
      } else if (key === "html") {
        config.html = val.toLowerCase() === "true";
      } else if (key === "tags column") {
        config.tagsColumn = parseInt(val, 10) || 0;
      }
      continue;
    }

    rows.push(raw);
  }

  const cards = rows.map((row) => {
    const fields = row.split(config.separator);
    const front = (fields[0] ?? "").trim();
    const back = (fields[1] ?? "").trim();
    let tags = "";
    if (config.tagsColumn > 0) {
      tags = (fields[config.tagsColumn - 1] ?? "").trim();
    }
    return { front, back, tags };
  });

  return { cards: cards.filter((c) => c.front || c.back), html: config.html };
}
