import * as React from 'react'

export interface IAppMenuItemProps {
  onClick: () => void
}

export default class AppMenuItem extends React.Component<IAppMenuItemProps> {
  render() {
    return (
      <li>
        {this.props.children}
      </li>
    )
  }
}
