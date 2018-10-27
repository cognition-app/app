import JSONSchema from '@cognition-app/schema/dist/base/json-schema'
import AppConfig from '../config'

/**
 * App as plugin context
 */
export default interface App<
  T extends string = 'https://raw.githubusercontent.com/cognition-app/app/master/dist/schema/app/plugin'
> extends JSONSchema<T> {
  /**
   * Supported plugin dictionary mapping $schema -> app type
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
