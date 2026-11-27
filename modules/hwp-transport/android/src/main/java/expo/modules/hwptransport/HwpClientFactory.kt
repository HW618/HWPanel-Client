package expo.modules.hwptransport

import java.security.KeyStore
import java.security.SecureRandom
import java.security.cert.CertificateException
import java.security.cert.X509Certificate
import java.util.concurrent.ConcurrentHashMap
import javax.net.ssl.HostnameVerifier
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager
import okhttp3.OkHttpClient

/**
 * One strict client for normal endpoints, plus lazily built relaxed clients
 * cached per opted-in `host:port`.
 *
 * A relaxed client's `HostnameVerifier` re-checks `HwpTrustStore` on every
 * handshake, so turning `allowSelfSigned` off immediately revokes trust even
 * for an already-cached client.
 */
object HwpClientFactory {
  private const val CONNECT_TIMEOUT_MS = 15_000L

  private val strictClient: OkHttpClient by lazy {
    OkHttpClient.Builder()
      .connectTimeout(CONNECT_TIMEOUT_MS, java.util.concurrent.TimeUnit.MILLISECONDS)
      .build()
  }

  private val relaxedClients = ConcurrentHashMap<String, OkHttpClient>()

  fun clientFor(host: String, port: Int): OkHttpClient {
    if (!HwpTrustStore.isAllowed(host, port)) {
      return strictClient
    }
    val key = HwpTrustStore.key(host, port)
    return relaxedClients.getOrPut(key) { buildRelaxedClient(host, port) }
  }

  private fun buildRelaxedClient(host: String, port: Int): OkHttpClient {
    val trustManager = RelaxedTrustManager()
    val sslContext = SSLContext.getInstance("TLS").apply {
      init(null, arrayOf<TrustManager>(trustManager), SecureRandom())
    }
    val verifier = HostnameVerifier { hostname, _ ->
      HwpTrustStore.isAllowed(host, port) && hostname.equals(host, ignoreCase = true)
    }

    return strictClient.newBuilder()
      .sslSocketFactory(sslContext.socketFactory, trustManager)
      .hostnameVerifier(verifier)
      .build()
  }
}

/**
 * Falls back to the platform trust anchors first; only when that fails does it
 * accept the chain. This instance is only ever installed on a client that is
 * cached for one opted-in `host:port`.
 */
private class RelaxedTrustManager : X509TrustManager {
  private val defaultTrustManager: X509TrustManager = run {
    val factory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
    factory.init(null as KeyStore?)
    factory.trustManagers.filterIsInstance<X509TrustManager>().first()
  }

  override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) {
    defaultTrustManager.checkClientTrusted(chain, authType)
  }

  override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) {
    try {
      defaultTrustManager.checkServerTrusted(chain, authType)
    } catch (_: CertificateException) {
      // Per-instance opt-in handled by HwpClientFactory/HwpTrustStore.
    }
  }

  override fun getAcceptedIssuers(): Array<X509Certificate> = defaultTrustManager.acceptedIssuers
}
