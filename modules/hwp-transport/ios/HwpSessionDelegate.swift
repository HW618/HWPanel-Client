import Foundation

/**
 * URLSession delegate used by every panel request.
 *
 * Default path: the system evaluates the chain and we accept only if it is
 * trusted. Fallback path: if evaluation fails AND the exact `host:port` was
 * opted into from JS (`allowSelfSigned`), accept that endpoint's chain.
 */
final class HwpSessionDelegate: NSObject, URLSessionDelegate {
  func urlSession(
    _ session: URLSession,
    didReceive challenge: URLAuthenticationChallenge,
    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
  ) {
    guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
          let serverTrust = challenge.protectionSpace.serverTrust else {
      completionHandler(.performDefaultHandling, nil)
      return
    }

    var evaluationError: CFError?
    if SecTrustEvaluateWithError(serverTrust, &evaluationError) {
      completionHandler(.useCredential, URLCredential(trust: serverTrust))
      return
    }

    let host = challenge.protectionSpace.host
    let port = challenge.protectionSpace.port
    guard HwpTrustStore.shared.isAllowed(host: host, port: port) else {
      completionHandler(.cancelAuthenticationChallenge, nil)
      return
    }

    // Explicit per-instance relaxation only. The credential is scoped to this
    // challenge; nothing leaks to other hosts.
    completionHandler(.useCredential, URLCredential(trust: serverTrust))
  }
}

/// Cookie storage stays in JS (`CookieJar`) so each server instance owns its
/// jar; URLSession must not keep a second, process-wide store.
final class HwpSessionFactory {
  private let delegate = HwpSessionDelegate()
  private let configuration: URLSessionConfiguration

  init() {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.httpCookieStorage = nil
    configuration.httpShouldSetCookies = false
    configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
    self.configuration = configuration
  }

  func makeSession() -> URLSession {
    // `delegate` is owned by this factory, which lives as long as the module.
    URLSession(configuration: configuration, delegate: delegate, delegateQueue: nil)
  }
}
