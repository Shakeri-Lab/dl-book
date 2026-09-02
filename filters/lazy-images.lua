--- lazy-images.lua --- Defer below-the-fold images in the canonical HTML.
---
--- The first content image remains eager because it is the most likely largest
--- contentful paint candidate. Every later image can decode asynchronously and
--- wait until the browser approaches it. The filter is inert for LaTeX/PDF.

if not FORMAT:match("^html") then
  return {}
end

local function add_loading_hints(doc)
  local first_image = true

  return doc:walk({
    Image = function(image)
      if first_image then
        first_image = false
        return nil
      end

      image.attributes.loading = "lazy"
      image.attributes.decoding = "async"
      return image
    end
  })
end

return {
  {Pandoc = add_loading_hints}
}
