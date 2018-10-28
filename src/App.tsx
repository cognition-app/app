import * as React from 'react'
import AppMenu from './AppMenu'
import AppMenuHr from './AppMenuHr'
import AppMenuItem from './AppMenuItem'
import AppMenuSearch from './AppMenuSearch'
import AppSchema from './schema/app/plugin'
import AppSchemaConfig from './schema/app/config'
import ErrorHandler from './ErrorHandler'
import PluginSchema from '@cognition-app/schema/dist/core/plugin'
import ProviderInstanceSchema from '@cognition-app/schema/dist/core/plugin/provider/instance'
import ProviderSchema from '@cognition-app/schema/dist/core/plugin/provider'
import RegistryInstanceSchema from '@cognition-app/schema/dist/core/plugin/registry/instance'
import RegistrySchema from '@cognition-app/schema/dist/core/plugin/registry'
import SettingsSchema from '@cognition-app/schema/dist/core/settings'
import ViewInstanceSchema from '@cognition-app/schema/dist/core/plugin/view/instance'
import ViewSchema from '@cognition-app/schema/dist/core/plugin/view'
import { assertType } from '@cognition-app/schema/dist/assert'
import { Map } from 'immutable'
import { PouchDB as ReactPouchDB } from 'react-pouchdb/browser'
import { withDB } from 'react-pouchdb/browser'

export interface IAppPartialProps {
  context: AppSchema
}

interface IAppProps extends IAppPartialProps {
  db: any, // PouchDB
}

interface IAppState {
  registries: Map<string, PluginSchema<RegistryInstanceSchema>>
  views: Map<string, PluginSchema<ViewInstanceSchema>>
  view?: string
  providers: Map<string, PluginSchema<ProviderInstanceSchema>>
  providerInstances: Map<string, any>
  pluginStatus: Map<string, string>
  registry: Map<string, PluginSchema>
  searchDocuments: string
  searchPlugins: string
}

class App extends React.Component<IAppProps, IAppState> {
  constructor(props: IAppProps) {
    super(props)

    this.state = {
      providers: Map(),
      pluginStatus: Map(),
      providerInstances: Map(),
      registries: Map(),
      registry: Map(),
      searchDocuments: '',
      searchPlugins: '',
      views: Map(),
    }

    this.install = this.install.bind(this)
    this._initialize = this._initialize.bind(this)
    this._install_registry = this._install_registry.bind(this)
    this._install_view = this._install_view.bind(this)
    this._install_provider = this._install_provider.bind(this)
  }

  componentDidMount() {
    this._initialize()
  }

  async _initialize() {
    // TODO: watch config

    // get existing config or defaultConfig
    let config: AppSchemaConfig
    try {
      config = assertType<AppSchemaConfig>(await this.props.db.get(this.props.context.configId))
    } catch {
      config = assertType<AppSchemaConfig>(this.props.context.config)
    }

    // Install all configured plugins
    for (const plugin of config.plugins) {
      await this.install(plugin)
    }

    // Set current view
    this.setState({
      view: config.view,
    })
  }

  async install(plugin: string) {
    if (plugin === '')
      return

    // Get plugin context
    const ctx = assertType<PluginSchema>(
      this.state.registry.get(plugin + '/package.json') || (
        (await
          (await
            fetch(plugin + '/package.json')
          ).json()
        )
      )
    )

    // Plugin type lookup
    const type: string = this.props.context.supportedPlugins[
      ctx.cognition.$schema
    ]
    if(type === undefined) {
      throw new Error(
        ctx.cognition.$schema + ' is not in `supportedPlugins`'
      )
    }

    // Install plugin based on type
    (this as any)['_install_'+type](plugin, ctx)
  }

  async _install_registry(plugin: string, ctx: PluginSchema<RegistrySchema>) {
    const registry = (await import(plugin + '/' + ctx.main)).default

    // Get actual registry items
    // const registry = assertType<PluginSchema<RegistryInstanceSchema>>({
    //   ...ctx,
    //   cognition: {
    //     ...ctx.cognition,
    //     items:
    //       await
    //         (await
    //           fetch(plugin + '/' + ctx.main)
    //         ).json()
    //   }
    // })

    // Load registry into state
    this.setState({
      registry: this.state.registry.merge(
        // Add namespace to item ids
        registry.cognition.items.reduce(
          (items: Map<string, PluginSchema>, item: PluginSchema) => (
            items.set(
              [
                ctx.name,
                item.name,
              ].join('/'),
              item
            )
          ), Map()
        )
      )
    })
  }

  async _install_view(plugin: string, ctx: PluginSchema<ViewSchema>) {
    // Complete view
    const view = assertType<PluginSchema<ViewInstanceSchema>>({
      ...ctx,
      cognition: {
        ...ctx.cognition,
        cls: (await import(plugin + '/' + ctx.main))
      }
    })

    console.log(view)

    // Load view into state
    this.setState({
      views: this.state.views.set(
        view.name,
        view
      ),
      pluginStatus: this.state.pluginStatus.set(
        'view.' + view.name, 'refresh'
      ),
    })
  }

  async _install_provider(plugin: string, ctx: PluginSchema<ProviderSchema>) {
    // Complete provider
    const provider = assertType<PluginSchema<ProviderInstanceSchema>>({
      ...ctx,
      cognition: {
        ...ctx.cognition,
        cls: (await import(plugin + '/' + ctx.main)).default
      }
    })

    this.setState({
      providers: this.state.providers.set(provider.name, provider)
    })

    // Watch/handle this provider's
    //  settings in db
    this.props.db.changes({
      live: true,
      include_docs: true,
      selector: {
        $schema: {
          '$eq': 'https://raw.githubusercontent.com/cognition-app/schema/master/dist/core/settings',
        },
        'content.$schema': {
          '$eq': ctx.cognition.settings,
        },
      },
    }).on('change', (info: PouchDB.Core.ChangesResponseChange<SettingsSchema>) => {
      const settings = info.doc

      if(settings._deleted) {
        // TODO: uninstall provider instance
        return
      }

      const id = [
        ctx.name,
        settings.name,
      ].join('/')

      const instance = provider.cognition.cls(
        settings.content as any
      )

      const sync = instance.sync(this.props.db, {
        live: true,
        retry: true,
        selector: {
          $schema: {
            '$eq': 'https://raw.githubusercontent.com/cognition-app/schema/master/dist/core/document',
          },
          'tags': {
            '$elemMatch': {
              '$eq': 'provider:' + id,
            }
          },
        }
      }).on('change', (info) => {
        // TODO: handle tag changes
        // TODO: notify
      }).on('active', () => {
        this.setState({
          pluginStatus: this.state.pluginStatus.set(
            'provider.' + id, 'sync'
          )
        })
      }).on('paused', () => {
        this.setState({
          pluginStatus: this.state.pluginStatus.set(
            'provider.' + id, 'sync_disabled'
          )
        })
      }).on('error', (err: any) => {
        // TODO: this._handle_error(ctx, err)
        console.error(err)
        this.setState({
          pluginStatus: this.state.pluginStatus.set(
            'provider.' + id, 'sync_problem'
          )
        })
      })

      // TODO: store this somewhere else
      this.setState({
        providerInstances: this.state.providerInstances.set(
          id,
          {
            settings,
            instance,
            sync,
          }
        )
      })
    }).on('error', (err: any) => {
      this._handle_error(ctx, err)
    })
  }

  _handle_error(plugin: PluginSchema, err: any, info?: any) {
    console.error(err)
    console.info(info)

    const type: string = this.props.context.supportedPlugins[
      plugin.cognition.$schema
    ]

    this.setState({
      view: undefined,
      pluginStatus: this.state.pluginStatus.set(
        type + '.' + plugin.name, 'error'
      )
    })
  }

  render(): JSX.Element {
    const view = this.state.view !== undefined ?
      this.state.views.get(this.state.view) : undefined

    const View = view !== undefined ? 
      view.cognition.cls : () => <div>No View</div>

    return (
      <div className="root">
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
                  className="sidenav-trigger hide-on-large"
                >
                  <i className="material-icons">menu</i>
                </a>
              </div>
            </nav>
          </div>
          <AppMenu id="sidenav">
            <AppMenuSearch
              hint="Find documents"
              value={this.state.searchDocuments}
              onChange={(searchDocuments) =>
                this.setState({searchDocuments})
              }
            />
            <AppMenuHr />
            {this.state.views.keySeq().map(viewInstanceKey => {
              const view = this.state.views.get(viewInstanceKey)
              const viewStatus = this.state.pluginStatus.get('view.' + viewInstanceKey)

              return (
                <li
                  key={"view." + view.name}
                  className={this.state.view === view.name ? "active" : ""}
                >
                  <span
                    style={{
                      display: 'block',
                      height: 48,
                      paddingLeft: 32,
                    }}
                  >
                    <a
                      href="#!"
                      onClick={() =>
                        this.setState({
                          view: view.name
                        })
                      }
                    >
                      {view.name}
                    </a>
                    <a
                      href="#!"
                      onClick={() => {
                        console.log('TODO: refresh')
                      }}
                    >
                      <i className="material-icons">
                        {viewStatus}
                      </i>
                    </a>
                    <a
                      href="#!"
                      onClick={() => {
                        this.setState({
                          view: 'settings',
                          searchDocuments: JSON.stringify({
                            $schema: {
                              '$eq': view.cognition.settings,
                            }
                          }),
                        })
                      }}
                    >
                      <i className="material-icons">
                        settings
                        </i>
                    </a>
                  </span>
                </li>
              )
            })}
            <AppMenuHr />
            {this.state.providerInstances.keySeq().map((providerInstanceKey) => {
              const provider = this.state.providers.get(providerInstanceKey.split('/')[0])
              const providerInstance = this.state.providerInstances.get(providerInstanceKey)
              const providerStatus = this.state.pluginStatus.get('provider.' + providerInstanceKey)

              return (
                <li
                  key={"provider." + provider}
                >
                  <span
                    style={{
                      display: 'block',
                      height: 48,
                      paddingLeft: 32,
                    }}
                  >
                    <a
                      href="#!"
                      onClick={() => (
                        this.setState({
                          view: 'settings',
                          searchDocuments: JSON.stringify({
                            $schema: {
                              '$eq': providerInstance.settings,
                            }
                          }),
                        })
                      )}
                    >
                      {provider.name}
                    </a>
                    <a
                      href="#!"
                      onClick={() => {
                        console.log('TODO: refresh')
                      }}
                    >
                      <i className="material-icons">
                        {providerStatus}
                      </i>
                    </a>
                    <a
                      href="#!"
                      onClick={() => {
                        this.setState({
                          view: 'settings',
                          searchDocuments: JSON.stringify({
                            $schema: {
                              '$eq': providerInstance.settings,
                            }
                          }),
                        })
                      }}
                    >
                      <i className="material-icons">
                        settings
                      </i>
                    </a>
                  </span>
                </li>
              )
            })}
            <AppMenuHr />
            <AppMenuSearch
              hint="Find plugins"
              value={this.state.searchPlugins}
              onChange={(searchPlugins) =>
                this.setState({searchPlugins})
              }
            />
            {this.state.registries.valueSeq().filter((plugin) => (
              plugin.name.includes(this.state.searchPlugins)
              || plugin.description.includes(this.state.searchPlugins)
            )).map((plugin: PluginSchema) => {
              this.install(plugin.name)
            })}
            <AppMenuItem
              onClick={() => {
                this.install(this.state.searchPlugins)
              }}
            >
              Install new
            </AppMenuItem>
          </AppMenu>
        </header>
        <main>
          <ErrorHandler
            onCatch={(err, info) => this._handle_error(view, err, info)}
          >
            <View
              db={this.props.db}
              search={this.state.searchDocuments}
            />
          </ErrorHandler>
        </main>
        <footer className="green page-footer footer-copyright" />
      </div>
    )
  }
}

export default function (props: IAppPartialProps) {
  const AppWithDB = withDB(App)
  return (
    <ReactPouchDB
      name={props.context.dbName}
    >
      <AppWithDB
        context={props.context}
      />
    </ReactPouchDB>
  )
}
