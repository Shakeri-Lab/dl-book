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
--- HTML lays the two children out as columns (see dlbook.scss). Print has a
--- five-inch text block, where two columns of Python would wrap into noise, so
--- LaTeX stacks them: the plan becomes a ruled panel above the code and the
--- wrapper div disappears. The [n] markers carry the mapping in both formats.

if not FORMAT:match("latex") then
  return {}
end

function Div(el)
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
