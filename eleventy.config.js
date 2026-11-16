export default function (eleventyConfig) {
  // Files copied to the site as-is
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });
  // /data/league.json is built by src/data-league.njk: the weekly stats plus any lane draws entered in schedule_set.json

  // Fill upcoming regular weeks from schedule_set.json; weeks already in the recap/centre data are left alone.
  // Attach each bowler's 2024-25 + 2025-26 lane-pair history (lane_history.json) to the stats data
  eleventyConfig.addFilter("withHistory", (league, hist) => {
    const H = (hist && hist.bowlers) || {};
    for (const b of league.bowlers) if (H[b.n]) b.lph = H[b.n];
    return league;
  });
  eleventyConfig.addFilter("withSchedule", (league, set) => {
    const out = JSON.parse(JSON.stringify(league));
    const weeks = (set && set.weeks) || {};
    for (const row of out.schedule) {
      const pairs = weeks[String(row.wk)];
      if (!pairs || row.st === "done" || row.st === "set") continue;
      row.m = pairs.map(([a, b], i) => ({ l: `${3 + 2 * i}-${4 + 2 * i}`, a, b }));
      row.st = "set";
      delete row.pp;
    }
    return out;
  });

  // News, stories and photo posts (newest first; pinned posts lead on the home page)
  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/posts/*.md").sort((a, b) => b.date - a.date)
  );

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  eleventyConfig.addFilter("niceDate", (d) => {
    const x = new Date(d);
    return `${MONTHS[x.getUTCMonth()]} ${x.getUTCDate()}, ${x.getUTCFullYear()}`;
  });
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("slug2", (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  eleventyConfig.addFilter("pts", (v) => (Number.isInteger(v) ? String(v) : Number(v).toFixed(1)));
  eleventyConfig.addFilter("comma", (v) => Number(v).toLocaleString("en-US"));
  eleventyConfig.addFilter("money2", (v) => Number(v).toFixed(2));
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("byCategory", (arr, c) => (arr || []).filter((p) => p.data.category === c));
  eleventyConfig.addFilter("pinnedFirst", (arr) => [...(arr || [])].sort((a, b) => (b.data.pinned ? 1 : 0) - (a.data.pinned ? 1 : 0) || b.date - a.date));

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
