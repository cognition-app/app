import * as React from 'react'
import * as ReactDOM from 'react-dom'
import App from './App'
import M from 'materialize-css/dist/js/materialize.min.js'
import './index.css'

export async function init(props, root?) {
  const app = <App {...props} />

  if (root === undefined)
    root = document.body

  ReactDOM.render(app, root)

  M.AutoInit();

  return app
}
