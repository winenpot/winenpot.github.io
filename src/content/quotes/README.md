# Footer quotes

One quote per `.json` file. The footer (`src/components/Shore.astro`) shows a
random one on every page load, never the same one twice in a row, like the
night sky does.

```json
{
  "text": "First line,\nsecond line.",
  "author": "Who said or wrote it",
  "source": "Where it comes from (optional)"
}
```

- `text`: no quotation marks; the footer adds them. `\n` breaks a line (verse).
- `author`: required. When the speaker is unknown or only quoted somewhere,
  say so ("Anonymous, quoted by …").
- `source`: optional; book, chapter, translator, year.
- The file name is the quote's id: lowercase-with-dashes. `?quote=<id>` on any
  page pins that quote (for screenshots). Files starting with `_` are ignored.

The schema is the `quotes` collection in `src/content.config.ts`. A missing
or misspelled field fails `pnpm build`.
