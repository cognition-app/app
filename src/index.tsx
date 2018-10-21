
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import App from './App'
import AppSchema from './schema/app/plugin'
import { cognition } from '../package.json'

const context = cognition as AppSchema

ReactDOM.render((
    <App
      context={context}
    />
  ),
  document.getElementById('root')
)
