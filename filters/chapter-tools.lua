--- chapter-tools.lua --- HTML-only links from each manuscript page to its
--- companion lecture resources, plus a reserved (non-link) notebook slot.
---
--- Lecture links are data, not prose: keep them in data/lectures.yml so the
--- mapping can be audited without editing thirty source pages. The filter is
--- deliberately inert outside HTML; the print editions remain unchanged.

if not FORMAT:match("^html") then
  return {}
end

local function read_file(path)
  local handle, message = io.open(path, "r")
  if not handle then
    error("Cannot open chapter-tools data " .. path .. ": " .. message)
  end
  local contents = handle:read("*a")
  handle:close()
  return contents
end

local function load_lectures()
  local project_dir = quarto.project.directory or "."
  local path = pandoc.path.join({project_dir, "data", "lectures.yml"})
  local source = read_file(path)
  local parsed = pandoc.read("---\n" .. source .. "\n---\n", "markdown")
  local lectures = parsed.meta.lectures
  if lectures == nil then
    error("data/lectures.yml must contain a top-level 'lectures' map")
  end
  return lectures
end

local function source_path()
  local project_dir = quarto.project.directory or "."
  local input = quarto.doc.input_file
  if input == nil or input == "" then
    input = PANDOC_STATE.input_files[1]
  end
  if input == nil or input == "" then
    error("Chapter tools could not determine the current source file")
  end
  return pandoc.path.normalize(
    pandoc.path.make_relative(input, project_dir)
  ):gsub("\\", "/"):gsub("^%./", "")
end

local function stringify(value)
  if value == nil then
    return nil
  end
  local text = pandoc.utils.stringify(value)
  if text == "" then
    return nil
  end
  return text
end

local function escape_html(text)
  return text
    :gsub("&", "&amp;")
    :gsub("<", "&lt;")
    :gsub(">", "&gt;")
    :gsub('"', "&quot;")
    :gsub("'", "&#39;")
end

local function tool_separator()
  return '<span class="chapter-tools__separator" aria-hidden="true">·</span>'
end

local function lecture_links(entries, source)
  if entries == nil then
    error("No lecture mapping found for " .. source)
  end

  local links = {}
  for _, entry in ipairs(entries) do
    local label = stringify(entry.label)
    local url = stringify(entry.url)
    if label == nil or url == nil then
      error("Every lecture entry for " .. source .. " needs label and url")
    end
    local kind = "specific"
    if label == "Lecture playlist" then
      kind = "fallback"
    end
    table.insert(
      links,
      '<a class="chapter-tools__link" data-kind="' .. kind ..
        '" href="' .. escape_html(url) .. '">' ..
        escape_html(label) .. "</a>"
    )
  end
  if #links == 0 then
    error("Lecture mapping for " .. source .. " must not be empty")
  end
  return links
end

local function optional_context(meta)
  local config = meta["chapter-tools"]
  if config == nil then
    return nil
  end

  local pieces = {}
  local builds_on = stringify(config["builds-on"])
  local learnable = stringify(config.learnable)
  if builds_on ~= nil then
    table.insert(
      pieces,
      '<span class="chapter-tools__context-item"><span class="chapter-tools__key">Builds on</span> ' ..
        escape_html(builds_on) .. "</span>"
    )
  end
  if learnable ~= nil then
    table.insert(
      pieces,
      '<span class="chapter-tools__context-item"><span class="chapter-tools__key">Makes learnable</span> ' ..
        escape_html(learnable) .. "</span>"
    )
  end
  if #pieces == 0 then
    return nil
  end
  return '<span class="chapter-tools__context">' ..
    table.concat(pieces, tool_separator()) .. "</span>"
end

local function chapter_tools(doc)
  local source = source_path()
  local entries = load_lectures()[source]

  -- The five Part transition pages intentionally remain quiet. Every other
  -- configured manuscript page has an explicit lectures.yml entry.
  if entries == nil and source:match("^chapters/parts/") then
    return doc
  end

  local items = lecture_links(entries, source)
  table.insert(
    items,
    '<span class="chapter-tools__placeholder" aria-disabled="true" title="Notebook companion planned">' ..
      'Notebook <span class="visually-hidden">(coming soon)</span></span>'
  )

  local context = optional_context(doc.meta)
  local context_html = ""
  if context ~= nil then
    context_html = "\n  " .. context
  end

  local aside = pandoc.RawBlock(
    "html",
    '<aside class="chapter-tools" aria-label="Chapter tools">\n' ..
      '  <span class="chapter-tools__label">Chapter tools</span>\n' ..
      '  <span class="chapter-tools__items">' ..
        table.concat(items, tool_separator()) .. "</span>" ..
      context_html .. "\n" ..
      "</aside>"
  )

  -- Index retains a visible Preface H1 in the body; chapter and appendix H1s
  -- become Quarto title blocks before this filter runs. Handle both shapes so
  -- the aside is always the first visible element after the page heading.
  for index, block in ipairs(doc.blocks) do
    if block.t == "Header" and block.level == 1 then
      doc.blocks:insert(index + 1, aside)
      return doc
    end
  end
  doc.blocks:insert(1, aside)
  return doc
end

return {
  {Pandoc = chapter_tools}
}
