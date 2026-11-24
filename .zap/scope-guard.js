// Forward only the local application. Block before opening an upstream socket.
// Encaminhe somente a aplicação local. Bloqueie antes de abrir conexão ao destino.
function proxyRequest(msg) {
    var uri = msg.getRequestHeader().getURI();
    return String(uri.getScheme()) === "http" && String(uri.getHost()) === "localhost" && uri.getPort() === 3000;
}
function proxyResponse(msg) { return true; }
