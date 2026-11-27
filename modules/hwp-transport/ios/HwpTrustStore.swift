import Foundation

/**
 * Per-instance trust allow-list, keyed by normalised `host:port`.
 *
 * Deliberately not a global flag: the delegate only accepts an untrusted
 * server certificate when the exact endpoint has been opted in from JS.
 */
final class HwpTrustStore {
  static let shared = HwpTrustStore()

  private let lock = NSLock()
  private var allowedKeys: Set<String> = []

  func setAllowed(host: String, port: Int, allowed: Bool) {
    let key = Self.key(host: host, port: port)
    lock.lock()
    defer { lock.unlock() }
    if allowed {
      allowedKeys.insert(key)
    } else {
      allowedKeys.remove(key)
    }
  }

  func isAllowed(host: String, port: Int) -> Bool {
    let key = Self.key(host: host, port: port)
    lock.lock()
    defer { lock.unlock() }
    return allowedKeys.contains(key)
  }

  func allowedKeys() -> [String] {
    lock.lock()
    defer { lock.unlock() }
    return allowedKeys.sorted()
  }

  static func key(host: String, port: Int) -> String {
    "\(normalize(host)):\(port)"
  }

  /// Must match `src/core/transport/trustKey.ts`.
  private static func normalize(_ host: String) -> String {
    var value = host.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    if value.hasPrefix("["), value.hasSuffix("]") {
      value = String(value.dropFirst().dropLast())
    }
    return value
  }
}
