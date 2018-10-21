import * as React from 'react'

interface IErrorHandlerState {
  hasError: boolean
}

export interface IErrorHandlerProps {
  onCatch: (error: any, info: any) => void
}

export default class ErrorHandler extends React.Component<IErrorHandlerProps, IErrorHandlerState> {
  constructor(props: IErrorHandlerProps) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error: any, info: any) {
    this.setState({
      hasError: true
    }, () => {
      this.props.onCatch(error, info)
    })
  }

  render() {
    if (this.state.hasError)
      return <h1>Something went wrong.</h1>;
    return this.props.children;
  }
}