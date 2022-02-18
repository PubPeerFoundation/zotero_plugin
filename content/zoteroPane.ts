declare const Zotero: IZotero
declare const Components: any
const usingXULTree = typeof Zotero.ItemTreeView !== 'undefined'

import { patch as $patch$ } from './monkey-patch'
// import { debug } from './debug'

const loaded: { document: HTMLDocument } = { document: null }

const seconds = 1000

// eslint-disable-next-line no-magic-numbers
function flash(title: string, body?: string, timeout = 8): void {
  try {
    const pw = new Zotero.ProgressWindow()
    pw.changeHeadline(`PubPeer: ${title}`)
    if (!body) body = title
    pw.addDescription(body)
    pw.show()
    pw.startCloseTimer(timeout * seconds)
  } catch (err) {
  }
}

export class ZoteroPane { // tslint:disable-line:variable-name
  public async load(globals) {
    loaded.document = globals.document

    loaded.document.getElementById('zotero-itemmenu').addEventListener('popupshowing', this, false)

    await Zotero.PubPeer.start()
  }

  public async unload() {
    loaded.document.getElementById('zotero-itemmenu').removeEventListener('popupshowing', this, false)
  }

  public handleEvent(event) {
    const items = Zotero.getActiveZoteroPane().getSelectedItems().filter(item => item.isRegularItem() && item.getField('DOI'))
    loaded.document.getElementById('menu-pubpeer-get-link').hidden = items.length === 0
  }

  public run(method, ...args) {
    this[method].apply(this, args).catch(err => Zotero.logError(`${method}: ${err}`))
  }

  public async getPubPeerLink() {
    let doi, feedback
    for (const item of Zotero.getActiveZoteroPane().getSelectedItems()) {
      if (item.isRegularItem() && (doi = item.getField('DOI'))) {
        if (feedback = (await Zotero.PubPeer.get([ doi ]))[0]) {
          let output = `The selected item has ${feedback.total_comments} ${feedback.total_comments === 1 ? 'comment' : 'comments'} on PubPeer`
          if (feedback.total_comments) output += ` ${feedback.url}`
          flash(doi, output)
        }
      }
    }
  }
}

// Monkey patch because of https://groups.google.com/forum/#!topic/zotero-dev/zy2fSO1b0aQ
$patch$(Zotero.getActiveZoteroPane(), 'serializePersist', original => function() {
  original.apply(this, arguments)

  let persisted
  if (Zotero.PubPeer.uninstalled && (persisted = Zotero.Prefs.get('pane.persist'))) {
    persisted = JSON.parse(persisted)
    delete persisted['zotero-items-column-pubpeer']
    Zotero.Prefs.set('pane.persist', JSON.stringify(persisted))
  }
})
