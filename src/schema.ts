interface str_dict<V = string> {
  [key: string]: V
}

export interface AppConfig {
  view: string
  plugins: string[]
}

interface Identifiable<Type extends string = string> {
  '@context': 'https://raw.githubusercontent.com/cognition-app/schema/master/core/Document.json'
  '@type': Type
  '@id': string
  name: string
  version: string
}

export interface PluginContext<Type extends string = string> extends Identifiable<Type> {
  entrypoint: string
}

export interface AppContext extends Identifiable<'core/App.json'> {
  supportedPlugins: str_dict
  dbName: string
  configKey: string
  defaultConfig: AppConfig
}


export interface RegistryContext extends PluginContext<'core/Registry.json'> {
}
export interface RegistryContextInstance extends RegistryContext {
}
export interface ViewContext extends PluginContext<'core/View.json'>  {
}
export interface ViewContextInstance extends ViewContext {
}
export interface ProviderContext extends PluginContext<'core/Provider.json'>  {
}
export interface ProviderContextInstance extends ProviderContext {
}

export enum ProviderStatus {
  Active = 'active',
  Paused = 'paused',
  Error = 'error',
}
