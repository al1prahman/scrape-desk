import * as cheerio from "cheerio";
import TurndownService from "turndown";

const REMOVE_SELECTOR = "script, style, noscript, iframe, svg, canvas, nav, footer, header, aside, form";

// HTML bersih jadi markdown supaya token yang dikirim ke LLM kecil dan fokus ke konten.
export function htmlToMarkdown(html: string): string {
  const $ = cheerio.load(html);
  $(REMOVE_SELECTOR).remove();

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  // Link cukup teksnya, URL-nya boros token dan nggak nambah informasi ekstraksi.
  turndown.addRule("simplifyLinks", {
    filter: ["a"],
    replacement: (content) => content,
  });
  turndown.remove("img");

  const markdown = turndown.turndown($.html("body") ?? html);
  return markdown.replace(/\n{3,}/g, "\n\n").trim();
}
