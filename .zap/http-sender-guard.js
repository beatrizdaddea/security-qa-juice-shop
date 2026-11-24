// Cover scanner/spider traffic and redirect hops as well as browser proxy traffic.
// Proteja tráfego do scanner/spider e saltos de redirecionamento, além do proxy.
function sendingRequest(msg, initiator, helper) {
    var uri = msg.getRequestHeader().getURI();
    if (String(uri.getScheme()) === "http" && String(uri.getHost()) === "localhost" && uri.getPort() === 3000) return;
    // Rewrite before transport to a harmless local path, without credentials/body.
    // Reescreva antes do transporte para caminho local inofensivo, sem credenciais/corpo.
    var URI = Java.type("org.apache.commons.httpclient.URI");
    msg.getRequestHeader().setURI(new URI("http://localhost:3000/__zap_scope_blocked__", false));
    msg.getRequestHeader().setMethod("GET");
    msg.getRequestHeader().setHeader("Host", "localhost:3000");
    msg.getRequestHeader().setHeader("Authorization", null);
    msg.getRequestHeader().setHeader("Cookie", null);
    msg.setRequestBody("");
    msg.getRequestHeader().setContentLength(0);
}
function responseReceived(msg, initiator, helper) {}
