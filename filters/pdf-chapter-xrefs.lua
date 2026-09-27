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

local function unnumbered_page(doc)
  for _, block in ipairs(doc.blocks) do
    if block.t == "Header" and block.level == 1 then
      return block.classes:includes("unnumbered")
    end
  end
  return false
end

function Pandoc(doc)
  if not quarto.doc.is_format("html") or not unnumbered_page(doc) then
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
      return pandoc.Link(words, href, "", pandoc.Attr("", { "quarto-xref" }))
    end,
  })
end
