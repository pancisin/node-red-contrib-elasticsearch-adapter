module.exports = function (RED) {
  "use strict";
  const i2cBus = require("./i2c-bus");
  const bus = i2cBus(1);

  bus.start();

  function I2CListenerNode(n) {
    RED.nodes.createNode(this, n);

    this.stack = parseInt(n.stack, 10);
    this.channel = parseInt(n.channel, 10);
    this.getPayload = (positive) => {
      if (positive) {
        return n.send || 1;
      }

      return 0;
    };
    var node = this;

    var listenerId = bus.register(this.stack, this.channel, (value) => {
      if (node.value !== value) {
        node.send({
          payload: node.getPayload(value !== 0),
          channel: node.channel,
          stack: node.stack,
        });
        node.value = value;
      }
    });

    this.log("Bus listener registered with id: " + listenerId);

    this.on("close", function () {
      node.log("On close event triggered.");
      bus.unregister(listenerId);
    });
  }

  RED.nodes.registerType("i2clistener", I2CListenerNode);
};
