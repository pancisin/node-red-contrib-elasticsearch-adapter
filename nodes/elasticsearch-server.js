module.exports = function (RED) {
  function ElasticSearchSeverNode(n) {
    RED.nodes.createNode(this, n);
    this.host = n.host;
    this.port = n.port;
  }
  RED.nodes.registerType("elasticsearch-server", ElasticSearchSeverNode);
};
