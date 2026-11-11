import assert from "node:assert/strict"
import { after, test } from "node:test"
import { createServer } from "vite"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

// Vite transforms the real TSX component without adding another test toolchain.
const server = await createServer({ server: { middlewareMode: true, ws: false }, appType: "custom" })
after(() => server.close())
const { ProjectFilter } = await server.ssrLoadModule("/src/components/project-filter.tsx")
const projects = Array.from({ length: 6 }, (_, i) => ({
  path: `/examples/project-${i}`,
  label: `project-${i}`,
  count: i + 1,
}))
const render = (props) =>
  renderToStaticMarkup(
    createElement(ProjectFilter, {
      projects,
      selectedPaths: null,
      disabled: false,
      onToggle() {},
      onReset() {},
      ...props,
    }),
  )

test("five projects render accessible toggle chips with paths and counts", () => {
  const html = render({ projects: projects.slice(0, 5), selectedPaths: [projects[0].path] })
  assert.equal((html.match(/<button/g) ?? []).length, 6)
  assert.match(html, /aria-label="Filter by project"/)
  assert.match(html, /title="\/examples\/project-0" aria-pressed="true"/)
  assert.match(html, /title="\/examples\/project-1" aria-pressed="false"/)
  assert.doesNotMatch(html, /aria-haspopup="menu"/)
})

test("six projects render a menu trigger showing the selected-project count", () => {
  const html = render({ selectedPaths: [projects[0].path, projects[1].path] })
  assert.equal((html.match(/<button/g) ?? []).length, 2)
  assert.match(html, /aria-haspopup="menu"/)
  assert.match(html, /2 selected/)
})

test("All projects is selected by default and drag state disables every chip", () => {
  const html = render({ projects: projects.slice(0, 5), disabled: true })
  assert.equal((html.match(/disabled=""/g) ?? []).length, 6)
  assert.match(html, /aria-pressed="true"[^>]*>All projects/)
  const dropdown = render({ disabled: true })
  assert.equal((dropdown.match(/<button\b[^>]* disabled=""/g) ?? []).length, 2)
})

test("retained projects with zero sessions count toward the dropdown threshold", () => {
  const html = render({
    projects: projects.map((project) => ({ ...project, count: 0 })),
    selectedPaths: projects.map(({ path }) => path),
  })
  assert.match(html, /6 selected/)
  assert.match(html, /aria-haspopup="menu"/)
})
