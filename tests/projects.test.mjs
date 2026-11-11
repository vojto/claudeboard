import assert from "node:assert/strict"
import { test } from "node:test"
import { archiveCard, dropCard, emptyBoard, mergeLiveSessions, parseBoard, toggleProject } from "../src/lib/board.ts"
import { listProjects, projectName, projectPath, visibleCardIds } from "../src/lib/projects.ts"

const session = (id, cwd) => ({ id, cwd, name: `Example ${id}`, status: "idle" })

function fixture() {
  const sessions = [
    session("a", "/examples/alpha"),
    session("hidden-1", "/examples/beta"),
    session("b", "/examples/alpha/.claude/worktrees/feature"),
    session("hidden-2", "/examples/beta"),
    session("c", "/examples/alpha"),
  ]
  const board = mergeLiveSessions(emptyBoard(), sessions)
  board.columns = [
    { id: "inbox", title: "Inbox", cardIds: sessions.map(({ id }) => id) },
    { id: "next", title: "Next", cardIds: [] },
  ]
  return { board, live: Object.fromEntries(sessions.map((item) => [item.id, item])) }
}

test("project identity groups Claude worktrees and handles roots and unknown folders", () => {
  assert.equal(projectPath("/examples/alpha"), "/examples/alpha")
  assert.equal(projectPath("/examples/alpha/"), "/examples/alpha")
  assert.equal(projectPath("/examples/alpha/.claude/worktrees/branch/src"), "/examples/alpha")
  assert.equal(projectPath("/examples/alpha/src"), "/examples/alpha/src")
  assert.equal(projectPath(""), "")
  assert.equal(projectName(""), "Unknown project")
  assert.equal(projectPath("/"), "/")
  assert.equal(projectName("/"), "/")
})

test("selection supports multiple projects and the last deselection restores All", () => {
  let board = toggleProject(emptyBoard(), "/examples/alpha")
  assert.deepEqual(board.selectedProjectPaths, ["/examples/alpha"])
  board = toggleProject(board, "/examples/beta")
  assert.deepEqual(board.selectedProjectPaths, ["/examples/alpha", "/examples/beta"])
  board = toggleProject(board, "/examples/alpha")
  assert.deepEqual(board.selectedProjectPaths, ["/examples/beta"])
  board = toggleProject(board, "/examples/beta")
  assert.equal(board.selectedProjectPaths, null)
})

test("old boards default to All and selections survive save/load", () => {
  const { selectedProjectPaths: _selection, ...oldBoard } = emptyBoard()
  assert.equal(parseBoard(JSON.stringify(oldBoard)).selectedProjectPaths, null)
  const selected = toggleProject(emptyBoard(), "/examples/alpha")
  assert.deepEqual(parseBoard(JSON.stringify(selected)), selected)
  assert.equal(parseBoard(null).selectedProjectPaths, null)
})

test("project counts ignore filters, archived, ended, and unplaced sessions", () => {
  let { board, live } = fixture()
  board = toggleProject(archiveCard(board, "hidden-1"), "/examples/alpha")
  delete live.c
  live.unplaced = session("unplaced", "/examples/unplaced")
  assert.deepEqual(listProjects(board, live), [
    { path: "/examples/alpha", label: "alpha", count: 2 },
    { path: "/examples/beta", label: "beta", count: 1 },
  ])
})

test("duplicate folder names remain separate and labels distinguish their paths", () => {
  const sessions = [session("a", "/examples/client/app"), session("b", "/examples/server/app"), session("u", "")]
  const board = mergeLiveSessions(emptyBoard(), sessions)
  const projects = listProjects(board, Object.fromEntries(sessions.map((item) => [item.id, item])))
  assert.equal(projects.length, 3)
  for (const project of projects.filter(({ path }) => path)) {
    assert.ok(project.label.includes(project.path))
    assert.equal(project.count, 1)
  }
  assert.ok(projects.some(({ label }) => label === "Unknown project"))
})

test("selected projects stay at zero, return with sessions, and disappear after reset", () => {
  const { board: initial, live } = fixture()
  const board = toggleProject(initial, "/examples/alpha")
  const ended = { "hidden-1": live["hidden-1"], "hidden-2": live["hidden-2"] }
  assert.equal(listProjects(board, ended).find(({ path }) => path === "/examples/alpha").count, 0)
  assert.deepEqual(visibleCardIds(board, board.columns[0], ended), [])
  assert.equal(listProjects(board, live).find(({ path }) => path === "/examples/alpha").count, 3)
  assert.equal(listProjects({ ...board, selectedProjectPaths: null }, ended).length, 1)
})

test("filtering preserves stored cards, columns, collapse state, and visible order", () => {
  const { board: initial, live } = fixture()
  const board = toggleProject(initial, "/examples/alpha")
  const before = JSON.stringify(board)
  assert.deepEqual(visibleCardIds(board, board.columns[0], live), ["a", "b", "c"])
  assert.deepEqual(visibleCardIds(board, board.columns[1], live), [])
  assert.equal(JSON.stringify(board), before)
  assert.equal(board.columns, initial.columns)
  assert.deepEqual(visibleCardIds(initial, initial.columns[0], live), ["a", "hidden-1", "b", "hidden-2", "c"])
})

test("drops on visible cards anchor to the full order and preserve hidden-card order", () => {
  const { board: initial, live } = fixture()
  const board = toggleProject(initial, "/examples/alpha")
  const down = dropCard(board, "a", "b", true)
  assert.deepEqual(down.columns[0].cardIds, ["hidden-1", "b", "a", "hidden-2", "c"])
  assert.deepEqual(visibleCardIds(down, down.columns[0], live), ["b", "a", "c"])
  const up = dropCard(board, "c", "a", true)
  assert.deepEqual(up.columns[0].cardIds, ["c", "a", "hidden-1", "b", "hidden-2"])
  assert.deepEqual(
    up.columns[0].cardIds.filter((id) => id.startsWith("hidden")),
    ["hidden-1", "hidden-2"],
  )
})

test("column-space drops append after hidden cards, including within the same column", () => {
  const { board } = fixture()
  board.columns[1].cardIds = ["ended"]
  const moved = dropCard(board, "a", "next", false)
  assert.deepEqual(moved.columns[1].cardIds, ["ended", "a"])
  const appended = dropCard(board, "a", "inbox", false)
  assert.deepEqual(appended.columns[0].cardIds, ["hidden-1", "b", "hidden-2", "c", "a"])
})

test("cross-column card drops insert before the visible target", () => {
  const { board } = fixture()
  board.columns[0].cardIds = ["a", "hidden-1"]
  board.columns[1].cardIds = ["hidden-2", "b", "c"]
  const moved = dropCard(board, "a", "b", true)
  assert.deepEqual(moved.columns[0].cardIds, ["hidden-1"])
  assert.deepEqual(moved.columns[1].cardIds, ["hidden-2", "a", "b", "c"])
  assert.equal(dropCard(board, "a", "a", true), board)
})
