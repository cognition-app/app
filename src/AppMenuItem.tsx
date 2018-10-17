import * as React from 'react'

export interface IAppMenuItemProps {
  label: string
}

export default class AppMenuItem extends React.Component<IAppMenuItemProps> {
  render() {
    return (
      <li>
        {this.props.label}
      </li>
    )
  }
}
