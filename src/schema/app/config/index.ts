import JSONLD from 'cognition-schema/dist/base/json-ld'

/**
 * App configuration
 */
export default interface AppConfig extends JSONLD<
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
