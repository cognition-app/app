import * as React from 'react'

export interface IAppMenuProps {
  id: string
}

export default class AppMenu extends React.Component<IAppMenuProps> {
  render() {
    return (
      <ul className="sidenav sidenav-fixed" {...this.props}>
        {this.props.children}
      </ul>
    )
  }
}
