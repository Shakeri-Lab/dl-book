-- Optional HTML-only views of existing chapter fixtures. PDFs are unchanged.
if not FORMAT:match("^html") then return {} end

local root = quarto.project.directory or "."
local function read(path)
  local file = assert(io.open(root .. "/interactives/" .. path, "r"))
  local content = file:read("*a")
  file:close()
  return content
end

return {{Pandoc = function(doc)
  local input = quarto.doc.input_file or PANDOC_STATE.input_files[1] or ""
  local scene, target
  if input:match("12%-kernel%-regression%.qmd$") then
    scene, target = "kernel-weighting", "cell-fig-kernel-lookup"
  elseif input:match("15%-bert%-pretraining%.qmd$") then
    scene, target = "bert-ledger", "cell-fig-mlm-policy"
  else return doc end
  local controls = read("shared/controls.html")
  local panel, count = read(scene .. "/panel.html"):gsub("<!%-%- PLAYER_CONTROLS %-%->", function() return controls end)
  assert(count == 1, "Mechanism excerpt must contain exactly one control placeholder")
  local html = "<style>\n" .. read("shared/player.css") .. "\n" ..
    read(scene .. "/player.css") .. "\n</style>\n" .. panel ..
    "\n<script>\n" .. read("shared/loader.js") .. "\n</script>"
  local inserted = 0
  doc = doc:walk({Div = function(div)
    if div.identifier == target then
      inserted = inserted + 1
      return {div, pandoc.RawBlock("html", html)}
    end
  end})
  assert(inserted == 1, "Mechanism excerpt needs exactly one insertion point: " .. target)
  return doc
end}}
