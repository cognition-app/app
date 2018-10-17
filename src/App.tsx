import * as React from 'react'
import { PouchDB, withDB, Find } from 'react-pouchdb/browser'
import { Map } from 'immutable'
import AppContainer from './AppContainer'
import AppMenu from './AppMenu'
import AppMenuHr from './AppMenuHr'
import AppMenuItem from './AppMenuItem'
import AppMenuSearch from './AppMenuSearch'
import * as schema from './schema'

export interface IAppPartialProps {
  context: schema.AppContext
}

interface IAppProps extends IAppPartialProps {
  db: any, // PouchDB
}

interface IAppState {
  repositories: Map<string, schema.RegistryContextInstance>
  views: Map<string, schema.ViewContextInstance>
  view: string
  providers: Map<string, schema.ProviderContextInstance>
  providerStatus: Map<string, schema.ProviderStatus>
  registry: Map<string, schema.PluginContext>
}

class App extends React.Component<IAppProps, IAppState> {
  constructor(props: IAppProps) {
    super(props)

    this.state = {
      repositories: Map(),
      views: Map(),
      view: null,
      providers: Map(),
      providerStatus: Map(),
      registry: Map(),
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
    // get existing config or defaultConfig
    let config
    try {
      config = await this.props.db.get(this.context.configKey)
    } catch {
      config = this.props.context.defaultConfig
    }

    // Install all configured plugins
    for (const plugin of config.plugins) {
      this.install(plugin)
    }

    // Set current view
    this.setState({
      view: config.view,
    })
  }

  async install(plugin: string) {
    // Get plugin context
    const ctx = (
      this.state.registry.get(plugin) || await (await fetch(plugin)).json()
    ) as schema.PluginContext

    // Plugin type lookup
    const type = this.props.context.supportedPlugins[
      ctx[`@type`]
    ]
    if(type === undefined) {
      throw new Error(
        ctx['@type'] + ' is not in `supportedPlugins`'
      )
    }
  
    // Install plugin based on type
    this['_install_'+type](ctx)
  }

  async _install_registry(ctx: schema.RegistryContext) {
    // Get actual registry items
    const registry = JSON.parse(
      await (await fetch(ctx.entrypoint)).json()
    )

    // Load registry into state
    this.setState({
      registry: this.state.registry.merge(
        // Add namespace to item ids
        registry.items.map(item => ({
          ...item,
          '@id': [
            ctx['@id'],
            item['@id'],
          ].join('/'),
        })),
      )
    })
  }

  async _install_view(ctx) {
    // Complete view
    const view = {
      ...ctx,
      cls: await import(ctx.entrypoint)
    }

    // Load view into state
    this.setState({
      views: this.state.views.set(
        view['@id'],
        view
      )
    })
  }

  async _install_provider(ctx) {
    // Complete provider
    const Provider = {
      ...ctx,
      cls: await import(ctx.entrypoint)
    }

    // Watch/handle this provider's
    //  settings in db
    db.changes({
      live: true,
      include_docs: true,
      selector: {
        '@type': {
          $eq: Provider.settings,
        }
      },
    }).on('change', ({settings}) => {
      let provider = Provider
      
      // Setup @id
      provider['@id'] = [
        provider['@id'],
        settings['@id'],
      ].join('/')

      // Create instance
      provider.instance = provider.cls(
        settings
      )

      // Initiate sync
      provider.sync = provider.instance.sync(this.props.db, {
        live: true,
        retry: true,
        selector: {
          '@type': {
            '$eq': 'core/Document.json'
          },
          'tags': {
            '$has': 'provider:' + provider['@id']
          }
        }
      }).on('change', ({doc}) => {
        // TODO: handle tag changes
        // TODO: notify
      }).on('active', (info) => {
        this.setState({
          providerStatus: providerStatus.set(
            provider['@id'],
            'active'
          )
        })
      }).on('paused', (info) => {
        this.setState({
          providerStatus: providerStatus.set(
            provider['@id'],
            'paused'
          )
        })
      }).on('error', (err) => {
        this.setState({
          providerStatus: providerStatus.set(
            provider['@id'],
            'error: ' + err
          )
        })
      })

      // Add to state
      this.setState({
        providers: this.state.providers.set(
          provider['@id'],
          provider
        )
      })
    }).on('error', (err) => {
      throw err
    })
  }

  render() {
    return (
      <AppContainer
        sidebar={() => (
          <AppMenu>
            <AppMenuSearch
              hint="Find documents"
              onSearch={searchDocuments =>
                this.setState({searchDocuments})
              }
            />
            <AppMenuHr />
            {this.state.views.map(view => (
              <AppMenuItem
                label={view.name}
                onClick={() =>
                  this.setState({view})
                }
              >
                {view.icon}
                {view.name}
              </AppMenuItem>
            ))}
            <AppMenuHr />
            {this.state.providers.map(provider => (
              <AppMenuItem
                onClick={() => (
                  this.setState({
                    view: {
                      'view': SettingsView,
                      'settings': provider.settings
                    }
                  })
                )}
              >
                {provider.icon}
                {provider.name}
                <Icon>{this.state.status[provider.name]}</Icon>
              </AppMenuItem>
            ))}
            <AppMenuHr />
            <AppMenuSearch
              hint="Find plugins"
              onSearch={searchPlugins =>
                this.setState({searchPlugins})
              }
            />
            {this.state.repositories.filter((plugin) => (
              any(
                plugin.name.includes(this.state.searchPlugins),
                plugin.description.includes(this.state.searchPlugins),
              )
            )).map(plugin => {
              this.install(plugin)
            })}
            <AppMenuItem
              label="Install new"
              onClick={() => {
                this.install(fetch(this.state.searchPlugins))
              }}
            />
          </AppMenu>
        )}
        body={() => {
          const View = this.state.view
          // TODO: get settings
          return (
            <View
              provider={db}
              search={this.state.search}
            />
          )
        }}
      />
    )
  }
}

export default function (props: IAppPartialProps) {
  const AppWithDB = withDB(App)
  return (
    <PouchDB
      name={props.context.dbName}
    >
      <AppWithDB
        context={props.context}
      />
    </PouchDB>
  )
}
