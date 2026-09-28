-- Chapter references that print the right number everywhere.
--
-- PDF: Quarto's book pipeline can resolve references to chapter-level `sec-*`
-- labels as the chapter-local number 1. Keep the automatic HTML cross-reference,
-- but give LaTeX an explicit, correctly numbered, hyperlinked chapter label.
--
-- HTML, unnumbered pages only (the Preface, the Epilogue): Quarto prints a chapter
-- reference made from an unnumbered page as the target's number and full title
-- ("6 When It Fails: ..."). There the filter writes the link itself, "Chapter 6",
-- to the chapter's page. Numbered pages keep Quarto's own cross-references.
--
-- Numbers come from filters/chapter-numbers.json, which scripts/chapter_numbers.py
-- derives from the reading order in _quarto.yml; a label's digits are not its
-- number. `@sec-x` prints "Chapter N"; the prefix-suppressed `[-@sec-x]` prints
-- only "N", so "Chapters [-@sec-a] and [-@sec-b]" reads "Chapters 9 and 10".
local chapters = nil

local function chapter_map()
  if chapters == nil then
    local path = pandoc.path.join({ pandoc.path.directory(PANDOC_SCRIPT_FILE), "chapter-numbers.json" })
    local handle = assert(io.open(path, "r"), "missing " .. path)
    chapters = pandoc.json.decode(handle:read("a"))
    handle:close()
  end
  return chapters
end

local function single_chapter(el)
  if #el.citations ~= 1 then
    return nil, nil
  end
  local citation = el.citations[1]
  return citation, chapter_map()[citation.id]
end

function Cite(el)
  if not quarto.doc.is_format("latex") then
    return nil
  end
  local citation, chapter = single_chapter(el)
  if chapter == nil then
    return nil
  end

  -- A Pandoc link to the chapter's label, not raw LaTeX: the LaTeX writer emits
  -- \hyperref[label]{...}, and a heading that holds the reference still stringifies
  -- to "Chapter N" for its PDF bookmark (raw LaTeX would stringify to nothing).
  local number = string.format("%d", math.floor(chapter.number))
  local text = "Chapter\u{A0}" .. number
  if citation.mode == "SuppressAuthor" then
    text = number
  end
  return pandoc.Link({ pandoc.Str(text) }, "#" .. citation.id)
end

-- Quarto moves a chapter's title heading into metadata before this filter runs, so
-- read the unnumbered flag from the source's first "# " line.
local function unnumbered_page()
  local handle = io.open(quarto.doc.input_file, "r")
  if handle == nil then
    return false
  end
  for line in handle:lines() do
    if line:match("^# ") then
      handle:close()
      return line:find(".unnumbered", 1, true) ~= nil
    end
  end
  handle:close()
  return false
end

function Pandoc(doc)
  if not quarto.doc.is_format("html") or not unnumbered_page() then
    return nil
  end
  local here = pandoc.path.directory(quarto.doc.input_file)
  local root = quarto.project.directory
  return doc:walk({
    Cite = function(el)
      local citation, chapter = single_chapter(el)
      if chapter == nil then
        return nil
      end
      local number = string.format("%d", math.floor(chapter.number))
      local href = pandoc.path.make_relative(pandoc.path.join({ root, chapter.html }), here, true)
      local words = { pandoc.Str(number) }
      if citation.mode ~= "SuppressAuthor" then
        words = { pandoc.Str("Chapter"), pandoc.Space(), pandoc.Str(number) }
      end
      -- Not class "quarto-xref": Quarto rewrites the text of those links after the
      -- filters run, which on these pages reinstates the title.
      return pandoc.Link(words, href, "", pandoc.Attr("", { "chapter-xref" }))
    end,
  })
end
