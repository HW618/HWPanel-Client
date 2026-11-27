package expo.modules.hwptransport

import java.util.concurrent.ConcurrentHashMap

/**
 * Per-instance trust allow-list keyed by normalised `host:port`.
 *
 * Must stay in sync with `src/core/transport/trustKey.ts` and the iOS
 * `HwpTrustStore`.
 */
object HwpTrustStore {
  private val allowedKeys: MutableSet<String> = ConcurrentHashMap.newKeySet()

  fun setAllowed(host: String, port: Int, enabled: Boolean) {
    val key = key(host, port)
    if (enabled) {
      allowedKeys.add(key)
    } else {
      allowedKeys.remove(key)
    }
  }

  fun isAllowed(host: String, port: Int): Boolean = allowedKeys.contains(key(host, port))

  fun allowedKeys(): List<String> = allowedKeys.sorted()

  fun key(host: String, port: Int): String = "${normalize(host)}:$port"

  private fun normalize(host: String): String =
    host.trim().lowercase().removeSurrounding("[", "]")
}
