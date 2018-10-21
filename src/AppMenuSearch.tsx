import * as React from 'react'

export interface IAppMenuSearchProps {
  hint: string
  value: string
  onChange: (search: string) => void
}

export default class AppMenuSearch extends React.Component<IAppMenuSearchProps> {
  render() {
    return (
      <li className="search-wrapper">
        <input
          type="text"
          placeholder={this.props.hint}
          value={this.props.value}
          onChange={(evt) => this.props.onChange(evt.target.value)}
        />
      </li>
    )
  }
}
