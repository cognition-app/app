import * as React from 'react'

interface IAppMenuSearchState {
  search: string
}

export interface IAppMenuSearchProps {
  hint: string
  search: string
  onSearch: (search: string) => void
}

export default class AppMenuSearch extends React.Component<IAppMenuSearchProps, IAppMenuSearchState> {
  constructor(props: IAppMenuSearchProps) {
    super(props)
    this.state = {
      search: ''
    }

    this.onChange = this.onChange.bind(this)
  }

  onChange(evt: React.ChangeEvent<HTMLInputElement>) {
    const search = evt.target.textContent
    this.setState({search}, () => this.props.onSearch(search))
  }

  render() {
    return (
      <li className="search-wrapper">
        <input
          type="text"
          placeholder={this.props.hint}
          value={this.state.search}
          onChange={this.onChange}
        />
      </li>
    )
  }
}
