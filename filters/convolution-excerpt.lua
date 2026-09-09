-- Optional HTML pacing for the existing Chapter 7 recipe and Exercise 1.
-- No manuscript, notebook, execution-cache, or PDF transformation.
if not FORMAT:match("^html") then return {} end

local root = quarto.project.directory or "."
local function read(name)
  local file = assert(io.open(root .. "/interactives/convolution/" .. name, "r"))
  local content = file:read("*a")
  file:close()
  return content
end

return {{Pandoc = function(doc)
  local input = quarto.doc.input_file or PANDOC_STATE.input_files[1] or ""
  if not input:match("07%-filters%-convolution%.qmd$") then return doc end
  local inserted = 0
  doc = doc:walk({Header = function(header)
    if header.level == 2 and pandoc.utils.stringify(header.content) == "The filter zoo" then
      inserted = inserted + 1
      return {pandoc.RawBlock("html", "<style>\n" .. read("player.css") ..
        "\n</style>\n" .. read("panel.html") .. "\n<script>\n" ..
        read("loader.js") .. "\n</script>"), header}
    end
  end})
  assert(inserted == 1, "Convolution excerpt needs exactly one Chapter 7 insertion point")
  return doc
end}}
