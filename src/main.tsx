import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import { BoardScreen } from "./screens/board-screen"

/*
 * App entry point. Mounts the board screen into #root.
 */

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BoardScreen />
  </React.StrictMode>,
)
