import ExpoModulesCore
import Foundation

/**
 * `HwpTransport` — panel HTTP transport with a per-instance TLS relaxation.
 *
 * T01 exposes `ping()` plus the trust-policy controls. The URLSession factory
 * and delegate below are the real implementation T05 will use for requests;
 * there is intentionally NO global "allow all certificates" switch.
 */
public class HwpTransportModule: Module {
  private let sessionFactory = HwpSessionFactory()

  public func definition() -> ModuleDefinition {
    Name("HwpTransport")

    Constant("platform") {
      "ios"
    }

    AsyncFunction("ping") { () -> String in
      "hwp-transport/ios"
    }

    /// `host:port` is the only thing that gets relaxed. Disabling revokes it
    /// immediately for new challenges.
    AsyncFunction("setAllowSelfSigned") { (host: String, port: Int, enabled: Bool) in
      HwpTrustStore.shared.setAllowed(host: host, port: port, allowed: enabled)
    }

    AsyncFunction("getAllowedHosts") { () -> [String] in
      HwpTrustStore.shared.allowedKeys()
    }

    // TODO(T05): expose request/openLogStream using `sessionFactory.makeSession()`.
  }
}
