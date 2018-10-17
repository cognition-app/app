import * as React from 'react'

export interface IAppContainerProps {
  sidebar: any
  body: any
}

export default class AppContainer extends React.Component<IAppContainerProps> {
  render() {
    const {
      sidebar: Sidebar,
      body: Body,
    } = this.props

    return (
      <div
        className="root"
      >
        <header>
          <div className="navbar-fixed">
            <nav className="green">
              <div className="nav-wrapper">
                <a
                 href="#!"
                 className="brand-logo"
                >
                  Cognition
                </a>
                <a
                  href="#"
                  data-target="sidenav"
                  className="sidenav-trigger show-on-large"
                >
                  <i className="material-icons">menu</i>
                </a>
              </div>
            </nav>
          </div>
          <Sidebar
            id="sidenav"
          />
        </header>
        <main>
          <Body />
        </main>
        <footer className="green page-footer">
          <div className="container">
            <div className="row">
              <div className="col l6 s12">
                <h5 className="white-text">Footer Content</h5>
                <p className="grey-text text-lighten-4">You can use rows and columns here to organize your footer content.</p>
              </div>
              <div className="col l4 offset-l2 s12">
                <h5 className="white-text">Links</h5>
                <ul>
                  <li><a className="grey-text text-lighten-3" href="#!">Link 1</a></li>
                  <li><a className="grey-text text-lighten-3" href="#!">Link 2</a></li>
                  <li><a className="grey-text text-lighten-3" href="#!">Link 3</a></li>
                  <li><a className="grey-text text-lighten-3" href="#!">Link 4</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-copyright">
            <div className="container">
              © 2018 Copyright Text
            <a className="grey-text text-lighten-4 right" href="#!">More Links</a>
            </div>
          </div>
        </footer>
      </div>
    )
  }
}
