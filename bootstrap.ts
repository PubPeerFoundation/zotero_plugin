declare const Zotero: any

import { log } from './content/log'

export async function startup({ id, version, rootURI }) {
  log('startup')
}

export function onMainWindowLoad({ window }) {
}

export function onMainWindowUnload({ window }) {
}

export function shutdown() {
}

export function uninstall() {
}
