import JSONLD from 'cognition-schema/dist/base/json-ld'
import AppConfig from '../config'

/**
 * App as plugin context
 */
export default interface App extends JSONLD<
  'https://raw.githubusercontent.com/cognition-app/app/master/dist/schema/app/plugin'
> {
  /**
   * Supported plugin dictionary mapping @type -> app type
   */
  supportedPlugins: {
    [type: string]: string
  }

  /**
   * Name of the primary database
   */
  dbName: string

  /**
   * App configuration id
   */
  configId: string

  /**
   * App configuration defaults
   */
  config: AppConfig
}
