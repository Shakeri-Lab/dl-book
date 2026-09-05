-- Keep file-backed Part prose on its KOMA opener, without changing HTML or
-- reimplementing Quarto's Part numbering, bookmarks, or title conversion.
-- Run before Quarto turns each level-one Part Header into a raw \part command.
function Div(el)
  if not FORMAT:match("latex") or
      not el.classes:includes("quarto-book-part") then
    return nil
  end

  local prefix, prose = pandoc.List(), pandoc.List()
  local heading = nil
  for _, block in ipairs(el.content) do
    if block.t == "Header" and block.level == 1 then
      if heading ~= nil then
        error("A PDF Part opener must contain exactly one title")
      end
      heading = block
    elseif heading == nil or (block.t == "RawBlock" and block.format == "html") then
      -- Quarto's hidden file metadata must remain available to its numbering pass.
      prefix:insert(block)
    elseif block.t == "Para" or block.t == "Plain" then
      prose:insert(block)
    else
      error("PDF Part preambles support prose only; unexpected " .. block.t)
    end
  end
  -- Quarto's synthetic Appendices part has no authored transition prose.
  if heading == nil or #prose == 0 then
    return nil
  end

  local latex = pandoc.write(pandoc.Pandoc(prose), "latex")
  prefix:insert(pandoc.RawBlock("latex",
    "\\setpartpreamble[u][\\textwidth]{%\n" ..
    "\\vspace{2\\baselineskip}\\normalfont\\normalsize\\raggedright\n" ..
    "\\noindent " .. latex .. "\\par\n}"))
  prefix:insert(heading)
  el.content = prefix
  return el
end
