module.exports = function (RED) {
  "use strict";

  function ElasticSearchCreateNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;

    this.server = RED.nodes.getNode(config.server);
    this.index = config.index;
    this.esClient = null;

    if (this.server != null) {
      const { Client } = require("@elastic/elasticsearch");

      const nodeUrl = `https://${this.server.host}:${this.server.port}`;
      const apiKey =
        "bmYtRUE0c0J1LWxUVkF6RXFLTks6QjZtWThsNUdRVy0tMXIwYTNBWFF6QQ==";

      this.esClient = new Client({
        node: nodeUrl,
        auth: {
          apiKey,
        },
        caFingerprint:
          "1A:CB:78:4A:4C:C7:50:EC:39:96:CE:61:EA:C4:46:6A:30:11:19:31:F3:EA:CA:C7:C5:C8:8A:46:AF:BF:2A:0C",
        tls: {
          rejectUnauthorized: false,
        },
      });

      this.esClient
        .info()
        .then((response) => {
          console.log(response);
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      console.log("no server config node!");
    }

    const { v4: uuidv4 } = require("uuid");

    this.on("input", function (msg, send, done) {
      if (this.esClient == null) {
        console.error("There is not an elasticSearch client registered!");
        done();
      }

      const documentId = msg.documentId || uuidv4();

      this.esClient
        .create({
          id: documentId,
          index: msg.index || node.index,
          document: msg.payload,
        })
        .then((response) => {
          send(response);
          if (done) {
            done();
          }
        })
        .catch((err) => {
          if (done) {
            done(err);
            return;
          }
          console.error(err);
        });
    });

    this.on("close", function () {
      node.log("On close event triggered.");
      // bus.unregister(listenerId);
    });
  }

  RED.nodes.registerType("elasticsearch-create", ElasticSearchCreateNode);
};
