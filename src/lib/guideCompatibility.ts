import { deserialize, serialize } from '@ungap/structured-clone'

/** Dagre uses these APIs; early Monterey WebKit does not provide them. */
export function installGuideCompatibility() {
  if (typeof Object.hasOwn !== 'function') Object.defineProperty(Object, 'hasOwn', {
    configurable: true, writable: true,
    value: (value: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(value, key),
  })
  if (typeof globalThis.structuredClone !== 'function') Object.defineProperty(globalThis, 'structuredClone', {
    configurable: true, writable: true,
    value: <T>(value: T, options?: StructuredSerializeOptions): T => {
      // Graph layout does not transfer objects. Never silently pretend a
      // transfer detached the caller's buffer on an older browser.
      if (options?.transfer?.length) throw new DOMException('Transfer is unavailable in this browser.', 'DataCloneError')
      return deserialize(serialize(value)) as T
    },
  })
}

installGuideCompatibility()
