import * as React from "react"
import * as ReactDOM from "react-dom"
import App from "./App"
import context from "../cognition.json"

ReactDOM.render(
  <App
    context={context}
  />,
  document.getElementById("root")
)
