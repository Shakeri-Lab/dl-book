-- Quarto's PDF book pipeline can resolve references to chapter-level `sec-*`
-- labels as the chapter-local number 1. Keep the automatic HTML cross-reference,
-- but give LaTeX an explicit, correctly numbered, hyperlinked chapter label.
--
-- Numbers come from filters/chapter-numbers.json, which scripts/chapter_numbers.py
-- derives from the reading order in _quarto.yml; a label's digits are not its
-- number. `@sec-x` prints "Chapter N"; the prefix-suppressed `[-@sec-x]` prints
-- only "N", so "Chapters [-@sec-a] and [-@sec-b]" reads "Chapters 9 and 10".
local numbers = nil

local function chapter_numbers()
  if numbers == nil then
    local path = pandoc.path.join({ pandoc.path.directory(PANDOC_SCRIPT_FILE), "chapter-numbers.json" })
    local handle = assert(io.open(path, "r"), "missing " .. path)
    numbers = pandoc.json.decode(handle:read("a"))
    handle:close()
  end
  return numbers
end

function Cite(el)
  if not quarto.doc.is_format("latex") or #el.citations ~= 1 then
    return nil
  end

  local citation = el.citations[1]
  local chapter = chapter_numbers()[citation.id]
  if chapter == nil then
    return nil
  end

  local text, plain = string.format("Chapter~%d", chapter), string.format("Chapter %d", chapter)
  if citation.mode == "SuppressAuthor" then
    text, plain = string.format("%d", chapter), string.format("%d", chapter)
  end
  -- \texorpdfstring keeps the link in the text and gives PDF bookmarks plain words,
  -- so a heading such as "Return to @sec-11-encoder-decoder's date task" outlines
  -- as "Return to Chapter 13's date task".
  return pandoc.RawInline(
    "latex",
    string.format("\\texorpdfstring{\\hyperref[%s]{%s}}{%s}", citation.id, text, plain)
  )
end
