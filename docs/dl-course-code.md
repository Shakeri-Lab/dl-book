# Using `dl-course-code` (the Manim working repo)

<https://github.com/Shakeri-Lab/dl-course-code> — the author's **actively evolving**
Manim animation repo for DS 6050/6210 lectures. It is a first-class *source* for this
book: it encodes his visual pedagogy per module and, crucially, contains polished
lecture spines. Always work from a fresh pull; it changes constantly.

```bash
# local working copy (keep OUT of Box, same as this repo)
git -C ~/dl-course-code pull 2>/dev/null || git clone https://github.com/Shakeri-Lab/dl-course-code ~/dl-course-code
```

## What to read, in order of value to the book

1. **`<module>/MODULE_NOTES.md` — read this FIRST when drafting a chapter.** Each module
   has one: a *polished lecture spine* (the auto-caption transcript cleaned into
   numbered topic paragraphs), plus scene coverage and known gaps. This is a better
   prose source than the raw transcripts in `dl-course-site/transcripts/` — same
   content, already de-noised. Map: `ds6050_01_foundations` ↔ book ch. 1–4 material,
   `ds6050_02_autograd` ↔ ch. 5 (+ init/norm forward refs), `ds6050_04_cnn`/`05_modern_cnn`
   ↔ ch. 7–9, `ds6050_07_rnn` ↔ ch. 10–11, `ds6050_08_attention` ↔ ch. 12–13,
   `ds6050_09_transformer` ↔ ch. 14, `ds6050_10_foundation_models` ↔ ch. 15–16.
   (`CURRICULUM.md` has the authoritative lecture↔module map; `ds6050_05` is
   intentionally absent.)
2. **`<module>/scenes/scene_NN_<topic>.py`** — each Scene is a worked-out visual
   explanation. When a book chapter needs a figure, check whether a scene already
   visualizes the idea and echo its *composition* (what is shown, in what order, what
   gets highlighted) in a matplotlib or TikZ figure. Don't try to embed rendered video
   frames; recreate the pedagogical content in book-native form.
3. **`DESIGN.md`** — his visual-design philosophy and pedagogical perimeter. Book
   figures should rhyme with it.
4. **`common/styling.py`** — the "Warm Academic" palette (burgundy `#722F37`, gold
   `#D4AF37`, amber `#F5A623`, cream on dark). NOTE: those colors assume a **dark
   video background**; the book is light. Do not copy hex values blindly — echo the
   *roles* (one warm accent for the object of attention, muted supporting colors) using
   the book's UVA palette (`dlbook.scss`: jblue `#232D4B`, rred/orange `#E57200`,
   uniblue `#5379AA`).
5. **`EXTRAS.md`** — non-lecture content index.

## Rules of engagement

- **Read-only.** The book repo never modifies `dl-course-code`; it is his working repo.
- **Cite provenance** in chapter frontmatter comments when a MODULE_NOTES spine or a
  scene informed a section/figure (e.g. `spine: ds6050_02_autograd/MODULE_NOTES.md §8–10`).
- MODULE_NOTES spines are *polished transcripts* — they satisfy the "traceable to seeds
  or transcripts" accuracy gate, and are preferred over raw `.txt` captions when both
  exist.
