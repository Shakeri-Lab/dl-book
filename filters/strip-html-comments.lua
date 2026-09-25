-- Provenance comments (lecture sources, seed files, transcript names, and
-- machine-local paths) are authoring records. They stay in the .qmd sources,
-- where the drafting workflow requires them, but they must never be published:
-- Pandoc otherwise passes HTML comments straight into the page source. Run this
-- filter last so it also removes comments that earlier filters inject.
--
-- Two boundaries keep it from touching anything else. It acts only on HTML
-- output, because the LaTeX writer drops raw HTML by itself. And it keeps
-- Quarto's own `<!-- quarto-... -->` markers: Quarto reads
-- `quarto-file-metadata` after user filters to track file boundaries, and a
-- book PDF without them loses its appendix mode (no \appendix, so Appendix A
-- prints as a numbered chapter). Quarto removes those markers from the pages
-- itself.

local html_output = FORMAT:match("html") ~= nil

local function strip(text)
  return (text:gsub("<!%-%-(.-)%-%->", function(body)
    if body:match("^%s*quarto%-") then
      return nil -- keep Quarto's marker unchanged
    end
    return ""
  end))
end

local function clean(el, empty)
  if not html_output or not el.format:match("^html") then
    return nil
  end
  local cleaned = strip(el.text)
  if cleaned == el.text then
    return nil
  end
  if cleaned:match("^%s*$") then
    return empty
  end
  el.text = cleaned
  return el
end

function RawBlock(el)
  return clean(el, {})
end

function RawInline(el)
  return clean(el, {})
end
