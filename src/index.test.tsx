import * as enzyme from 'enzyme'
import * as Adapter from 'enzyme-adapter-react-16'

enzyme.configure({ adapter: new Adapter() })

if(module.hot) {
  const context = require.context(
    "mocha-loader!./",
    true,
    /\.test\.[tj]sx?$/,
  )
  context.keys().forEach(context)
}
