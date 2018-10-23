import JSONLD from '@cognition-app/schema/dist/base/json-ld'
import AppConfig from '../config'

/**
 * App as plugin context
 */
export default interface App<
  T extends string = 'https://raw.githubusercontent.com/cognition-app/app/master/dist/schema/app/plugin'
> extends JSONLD<T> {
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
