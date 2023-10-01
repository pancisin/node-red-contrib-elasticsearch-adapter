module.exports = function (RED) {
  "use strict";

  function ElasticSearchCreateNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;

    this.server = RED.nodes.getNode(config.server);
    this.index = config.index;

    if (this.server != null) {
      const { Client } = require("@elastic/elasticsearch");

      const nodeUrl = `https://${this.server.host}:${this.server.port}`;
      const apiKey =
        "cXBaQzRvb0JTR3I0Y2NEZDduOG46RlVSZjNOOGRUVHlPVFFZWlVaU3VPQQ==";

      const client = new Client({
        node: nodeUrl,
        auth: {
          apiKey,
        },
        caFingerprint:
          "13:7E:D2:98:E0:C8:62:CA:96:75:2A:21:22:5F:68:5B:C0:21:BC:CB:07:29:AC:80:C1:0C:B5:D6:E4:B4:04:B2",
        tls: {
          rejectUnauthorized: false,
        },
      });
    } else {
      console.log("no server config node!");
    }

    this.on("input", function (msg, send, done) {
      try {
        const response = client.create({
          id: msg.id,
          index: msg.index || node.index,
          document: msg.payload,
        });

        console.log(response);
      } catch (err) {}

      if (done) {
        done();
      }
    });

    this.on("close", function () {
      node.log("On close event triggered.");
      // bus.unregister(listenerId);
    });
  }

  RED.nodes.registerType("elasticsearch-create", ElasticSearchCreateNode);
};