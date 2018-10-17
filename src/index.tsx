
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as schema from 'cognition-schema'
import App from './App'

const context = require('../package.json').cognition as schema.AppContext

ReactDOM.render((
    <App
      context={context}
    />
  ),
  document.getElementById('root')
)
