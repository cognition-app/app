
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import App from './App'
import AppSchema from './schema/app/plugin'
import { cognition } from '../package.json'

const context = cognition as AppSchema

const app = (
  <App
    context={context}
  />
)

ReactDOM.render(
  app,
  document.getElementById('root')
)

export default app
