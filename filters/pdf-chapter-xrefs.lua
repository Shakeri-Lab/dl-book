-- Quarto's PDF book pipeline can resolve references to chapter-level `sec-*`
-- labels as the chapter-local number 1. Keep the automatic HTML cross-reference,
-- but give LaTeX an explicit, correctly numbered, hyperlinked chapter label.
function Cite(el)
  if not quarto.doc.is_format("latex") or #el.citations ~= 1 then
    return nil
  end

  local id = el.citations[1].id
  local chapter = id:match("^sec%-(%d%d)%-")
  if chapter == nil then
    return nil
  end

  return pandoc.RawInline(
    "latex",
    string.format("\\hyperref[%s]{Chapter~%d}", id, tonumber(chapter))
  )
end
