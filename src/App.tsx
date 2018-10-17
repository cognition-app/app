import * as React from 'react'
import * as schema from 'cognition-schema'
import { Map } from 'immutable'
import AppContainer from './AppContainer'
import AppMenu from './AppMenu'
import AppMenuHr from './AppMenuHr'
import AppMenuItem from './AppMenuItem'
import AppMenuSearch from './AppMenuSearch'
import {
  PouchDB as ReactPouchDB,
  withDB
} from 'react-pouchdb/browser'

export interface IAppPartialProps {
  context: schema.AppContext
}

interface IAppProps extends IAppPartialProps {
  db: any, // PouchDB
}

interface IAppState {
  repositories: Map<string, schema.RegistryContextInstance>
  views: Map<string, schema.ViewContextInstance>
  view: schema.ViewContextInstance
  providers: Map<string, schema.ProviderContextInstance>
  providerStatus: Map<string, schema.ProviderStatus>
  registry: Map<string, schema.PluginContext>
  searchDocuments: string
  searchPlugins: string
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
      searchDocuments: '',
      searchPlugins: '',
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
    const type: string = this.props.context.supportedPlugins[
      ctx[`@type`]
    ]
    if(type === undefined) {
      throw new Error(
        ctx['@type'] + ' is not in `supportedPlugins`'
      )
    }
  
    // Install plugin based on type
    (this as any)['_install_'+type](ctx)
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
        registry.items.map((item: schema.PluginContext) => ({
          ...item,
          '@id': [
            ctx['@id'],
            item['@id'],
          ].join('/'),
        }) as schema.PluginContext),
      )
    })
  }

  async _install_view(ctx: schema.ViewContext) {
    // Complete view
    const view = {
      ...ctx,
      cls: await import(ctx.entrypoint)
    } as schema.ViewContextInstance

    // Load view into state
    this.setState({
      views: this.state.views.set(
        view['@id'],
        view
      )
    })
  }

  async _install_provider(ctx: schema.ProviderContext) {
    // Complete provider
    const Provider = (
      await import(ctx.entrypoint)
    ) as schema.ProviderClass

    // Watch/handle this provider's
    //  settings in db
    this.props.db.changes({
      live: true,
      include_docs: true,
      selector: {
        '@type': {
          $eq: ctx.settings,
        }
      },
    }).on('change', (info: PouchDB.Core.ChangesResponseChange<schema.SettingsContext>) => {
      const settings = info.doc as schema.SettingsContext

      const id = [
        ctx['@id'],
        settings['@id'],
      ].join('/')

      const instance = Provider(
        settings
      )

      const sync = instance.sync(this.props.db, {
        live: true,
        retry: true,
        selector: {
          '@type': {
            '$eq': 'core/Document.json'
          },
          'tags': {
            '$has': 'provider:' + id
          }
        }
      }).on('change', () => {
        // TODO: handle tag changes
        // TODO: notify
      }).on('active', () => {
        this.setState({
          providerStatus: this.state.providerStatus.set(
            id, schema.ProviderStatus.Active
          )
        })
      }).on('paused', () => {
        this.setState({
          providerStatus: this.state.providerStatus.set(
            id, schema.ProviderStatus.Paused
          )
        })
      }).on('error', (err: any) => {
        console.error(err)
        this.setState({
          providerStatus: this.state.providerStatus.set(
            id, schema.ProviderStatus.Error
          )
        })
      })

      const provider = {
        ...ctx,
        '@id': id,
        instance,
        sync,
      } as schema.ProviderContextInstance

      // Add to state
      this.setState({
        providers: this.state.providers.set(id, provider)
      })
    }).on('error', (err: any) => {
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
                onClick={() =>
                  this.setState({
                    view: this.state.views.get(view['@id'])
                  })
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
                      ...this.state.views.get('settings'),
                      settings: provider.settings,
                    },
                  })
                )}
              >
                {provider.icon}
                {provider.name}
                {this.state.providerStatus.get(provider['@id'])}
              </AppMenuItem>
            ))}
            <AppMenuHr />
            <AppMenuSearch
              hint="Find plugins"
              onSearch={(searchPlugins) =>
                this.setState({searchPlugins})
              }
            />
            {this.state.repositories.filter((plugin) => (
              plugin.name.includes(this.state.searchPlugins)
              || plugin.description.includes(this.state.searchPlugins)
            )).map((plugin: schema.PluginContext) => {
              this.install(plugin["@id"])
            })}
            <AppMenuItem
              onClick={() => {
                this.install(this.state.searchPlugins)
              }}
            >
              Install new
            </AppMenuItem>
          </AppMenu>
        )}
        body={() => {
          const View = this.state.view.cls
          return (
            <View
              provider={this.props.db}
              search={this.state.searchDocuments}
              settings={this.state.view.settings}
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
    <ReactPouchDB
      name={props.context.dbName}
    >
      <AppWithDB
        context={props.context}
      />
    </ReactPouchDB>
  )
}
