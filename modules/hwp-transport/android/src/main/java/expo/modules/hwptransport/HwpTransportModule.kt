package expo.modules.hwptransport

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * `HwpTransport` — panel HTTP transport with a per-instance TLS relaxation.
 *
 * T01 exposes `ping()` plus trust-policy controls. `HwpClientFactory` is the
 * real OkHttp wiring T05 will use; there is intentionally no global
 * trust-all client.
 */
class HwpTransportModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("HwpTransport")

    Constant("platform") {
      "android"
    }

    AsyncFunction("ping") {
      "hwp-transport/android"
    }

    // `host:port` is the only thing relaxed; disabling revokes it for new
    // handshakes (the hostname verifier re-checks the allow-list).
    AsyncFunction("setAllowSelfSigned") { host: String, port: Int, enabled: Boolean ->
      HwpTrustStore.setAllowed(host, port, enabled)
    }

    AsyncFunction("getAllowedHosts") {
      HwpTrustStore.allowedKeys()
    }

    // TODO(T05): expose request/openLogStream using HwpClientFactory.
  }
}
