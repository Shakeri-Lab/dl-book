--- plan-code.lua — Plan → Code panels.
---
--- Authoring form:
---   :::: {.plan-code}
---   ::: {.plan}
---   1. step one
---   2. step two
---   :::
---   ```{python}
---   ...            # [1]
---   ```
---   ::::
---
--- HTML lays compact examples out as columns and stacks long examples (see
--- dlbook.scss). Print has a five-inch text block, where two columns of Python
--- would wrap into noise, so LaTeX always stacks them: the plan becomes a ruled
--- panel above the code and the wrapper div disappears. The [n] markers carry
--- the mapping in both formats.

local function project_include(el)
  local relative_path = el.attributes["book-include"]
  if not relative_path then
    return nil
  end

  local project_dir = quarto.project.directory or "."
  local source_path = pandoc.path.join({project_dir, relative_path})
  local source, message = io.open(source_path, "r")
  if not source then
    error("Cannot open Plan → Code source " .. source_path .. ": " .. message)
  end

  local contents = source:read("*a")
  source:close()
  local lines = {}
  for line in (contents .. "\n"):gmatch("(.-)\n") do
    table.insert(lines, line)
  end
  if lines[#lines] == "" then
    table.remove(lines)
  end

  local first = tonumber(el.attributes["start-line"]) or 1
  local last = tonumber(el.attributes["end-line"]) or #lines
  local selected = {}
  for index = first, math.min(last, #lines) do
    table.insert(selected, lines[index])
  end
  el.text = table.concat(selected, "\n")
  el.attributes["book-include"] = nil
  el.attributes["start-line"] = nil
  el.attributes["end-line"] = nil
  return el
end

function CodeBlock(el)
  return project_include(el)
end

function Div(el)
  if not FORMAT:match("latex") then
    return nil
  end
  if el.classes:includes("plan") then
    el.classes = el.classes:filter(function(c) return c ~= "plan" end)
    return {
      pandoc.RawBlock("latex", "\\begin{planbox}"),
      el,
      pandoc.RawBlock("latex", "\\end{planbox}"),
    }
  elseif el.classes:includes("plan-code") then
    return el.content
  end
end
