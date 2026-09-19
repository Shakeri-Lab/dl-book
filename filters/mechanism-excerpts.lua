-- Optional HTML-only views of existing chapter fixtures. PDFs are unchanged.
if not FORMAT:match("^html") then return {} end

-- Which scene belongs to which chapter is data, not code: interactives/manifest.json
-- names every scene, the chapter it mirrors, and the anchor it is inserted at. This
-- filter reads that index the way filters/chapter-tools.lua reads
-- scripts/notebook_manifest.json -- pandoc.json.decode, no hand-rolled parser -- and
-- stays fail-closed: every scene the manifest hands this document must find exactly
-- one insertion point, or the build stops.

local SELF = "filters/mechanism-excerpts.lua"
local root = quarto.project.directory or "."

local function slurp(path)
  local file = assert(io.open(path, "r"), "Mechanism excerpts cannot read " .. path)
  local content = file:read("*a")
  file:close()
  return content
end

local function read(path) return slurp(root .. "/interactives/" .. path) end

local function normalize(path)
  return (pandoc.path.normalize(path):gsub("\\", "/"):gsub("^%./", ""))
end

local function source_path()
  local input = quarto.doc.input_file
  if input == nil or input == "" then input = PANDOC_STATE.input_files[1] end
  if input == nil or input == "" then return nil end
  return normalize(pandoc.path.make_relative(input, root))
end

-- Every scene this filter owns for the document being rendered, in manifest order.
-- A scene shipped by another filter (convolution runs its own) is not this one's work.
local function scenes_for(source)
  local parsed = pandoc.json.decode(read("manifest.json"))
  assert(parsed.schemaVersion == 1 and type(parsed.scenes) == "table",
    "interactives/manifest.json must use schema version 1")
  local mine = {}
  for _, scene in ipairs(parsed.scenes) do
    if normalize(scene.filter) == SELF and normalize(scene.qmd) == source then
      local anchor = scene.anchor
      assert(type(anchor) == "table" and type(anchor.target) == "string" and
        (anchor.type == "after-cell" or anchor.type == "before-heading"),
        "Mechanism excerpt has no usable anchor: " .. tostring(scene.id))
      table.insert(mine, scene)
    end
  end
  return mine
end

-- Pandoc's smart-quote extension turns the manuscript's ASCII quotes, apostrophes and
-- dashes into their typographic forms, so a heading reads one way in the .qmd and
-- another in the AST this filter walks. Compare a normalized form, the same one
-- scripts/audit_excerpt_fixtures.py applies to the source, so a manifest target written
-- in plain ASCII matches the heading it names on both sides.
local function normalize_heading(text)
  return (text:gsub("\226\128\152", "'"):gsub("\226\128\153", "'")
    :gsub("\226\128\156", '"'):gsub("\226\128\157", '"')
    :gsub("\226\128\147", "-"):gsub("\226\128\148", "-")
    :gsub("`", ""))
end

-- after-cell: the exact div Quarto derives from an executable cell's label.
-- before-heading: a level-2/3 heading whose text matches the target after normalization.
local function is_anchor(scene, block)
  if scene.anchor.type == "after-cell" then
    return block.t == "Div" and block.identifier == scene.anchor.target
  end
  return block.t == "Header" and (block.level == 2 or block.level == 3)
    and normalize_heading(pandoc.utils.stringify(block.content))
      == normalize_heading(scene.anchor.target)
end

local controls, shared_css, loader

local function panel_block(scene, with_shared, with_loader)
  controls = controls or read("shared/controls.html")
  local panel, count = read(scene.scene .. "/panel.html")
    :gsub("<!%-%- PLAYER_CONTROLS %-%->", function() return controls end)
  assert(count == 1, "Mechanism excerpt must contain exactly one control placeholder")
  local css = read(scene.scene .. "/player.css")
  -- The shared stylesheet is emitted once per document and every scene adds only its
  -- own rules, so a second panel on the same page repeats none of them.
  if with_shared then
    shared_css = shared_css or read("shared/player.css")
    css = shared_css .. "\n" .. css
  end
  local html = "<style>\n" .. css .. "\n</style>\n" .. panel
  -- One loader per document, emitted after the last panel on the page so that it sees
  -- every root it has to wire, however many scenes the manifest gives this chapter.
  if with_loader then
    loader = loader or read("shared/loader.js")
    html = html .. "\n<script>\n" .. loader .. "\n</script>"
  end
  return pandoc.RawBlock("html", html)
end

return {{Pandoc = function(doc)
  local source = source_path()
  if source == nil then return doc end
  local scenes = scenes_for(source)
  if #scenes == 0 then return doc end

  -- Document order, not manifest order, decides which panel carries the shared
  -- stylesheet and which panel the loader follows.
  local order = {}
  local function note(block)
    for index, scene in ipairs(scenes) do
      if is_anchor(scene, block) then table.insert(order, index) end
    end
  end
  doc:walk({Div = note, Header = note})
  local first, last = order[1], order[#order]

  for index, scene in ipairs(scenes) do
    local block = panel_block(scene, index == first, index == last)
    local inserted = 0
    doc = doc:walk({
      Div = function(div)
        if is_anchor(scene, div) then
          inserted = inserted + 1
          return {div, block}
        end
      end,
      Header = function(header)
        if is_anchor(scene, header) then
          inserted = inserted + 1
          return {block, header}
        end
      end
    })
    assert(inserted == 1,
      "Mechanism excerpt needs exactly one insertion point: " .. scene.anchor.target)
  end
  return doc
end}}
