import ELK from 'elkjs/lib/elk-api.js'
import ElkWorker from 'elkjs/lib/elk-worker.min.js?worker'

export function createElk() {
  return new ELK({ workerFactory: () => new ElkWorker() })
}
