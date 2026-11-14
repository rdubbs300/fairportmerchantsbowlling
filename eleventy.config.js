export default function (eleventyConfig) {
  // Files copied to the site as-is
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });
  eleventyConfig.addPassthroughCopy({ "src/_data/league.json": "data/league.json" });

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
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("byCategory", (arr, c) => (arr || []).filter((p) => p.data.category === c));
  eleventyConfig.addFilter("pinnedFirst", (arr) => [...(arr || [])].sort((a, b) => (b.data.pinned ? 1 : 0) - (a.data.pinned ? 1 : 0) || b.date - a.date));

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
