import * as React from 'react'

export default class AppMenu extends React.Component {
  render() {
    return (
      <ul className="sidenav sidenav-fixed" {...this.props}>
        {this.props.children}
      </ul>
    )
  }
}
