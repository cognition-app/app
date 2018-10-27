import JSONSchema from '@cognition-app/schema/dist/base/json-schema'

/**
 * App configuration
 */
export default interface AppConfig extends JSONSchema<
  'https://raw.githubusercontent.com/cognition-app/app/master/dist/schema/app/config'
> {
  /**
   * Current focused view
   */
  view: string

  /**
   * Installed plugins
   */
  plugins: string[]
}
