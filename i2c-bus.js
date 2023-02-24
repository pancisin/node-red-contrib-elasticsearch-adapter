const DEFAULT_HW_ADD = 0x20;
const IN_REG = 0x00;

var log4js = require("log4js");
var logger = log4js.getLogger("[pancisin-i2c-bus]");
logger.level = "debug";

const uuidv4 = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const mask = new ArrayBuffer(16);
mask[0] = 0x8000;
mask[1] = 0x4000;
mask[2] = 0x2000;
mask[3] = 0x1000;
mask[4] = 0x0800;
mask[5] = 0x0400;
mask[6] = 0x0200;
mask[7] = 0x0100;
mask[8] = 0x80;
mask[9] = 0x40;
mask[10] = 0x20;
mask[11] = 0x10;
mask[12] = 0x08;
mask[13] = 0x04;
mask[14] = 0x02;
mask[15] = 0x01;

class I2CBus {
  constructor(bus) {
    const i2c = require("i2c-bus");
    this.port = i2c.openSync(bus);

    this.subscribers = {};
    this.stackMap = {};
    this.stackValueMap = {};
    this.valueMap = {};
    this.intervalId = null;
  }

  register(stackLevel, channel, callback = () => {}) {
    const id = uuidv4();
    const address = DEFAULT_HW_ADD + (stackLevel ^ 0x07);

    if (this.stackMap[stackLevel] == null) {
      this.stackMap = {
        ...this.stackMap,
        [stackLevel]: {
          level: stackLevel,
          address,
        },
      };
    }

    this.subscribers = {
      ...this.subscribers,
      [id]: {
        id,
        mask: mask[channel - 1],
        address,
        callback,
      },
    };

    logger.info(
      `Registered Subscriber ${id} (lvl: ${stackLevel}, ch: ${channel}).`
    );
    return id;
  }
  
  unregister(listenerId) {
    const { [listenerId]: subscriber, ...newSubscribers } = this.subscribers;
    this.subscribers = newSubscribers;
     logger.info(
      `Removed Subscriber ${id} (lvl: ${stackLevel}, ch: ${channel}).`
    );
  }

  start() {
    if (this.port == null) {
      throw new Error("Bus port not initialized!");
    }

    this.intervalId = setInterval(() => {
      Object.values(this.stackMap).forEach((stack) => {
        const { level, address } = stack;
        const rawData = this.port.readWordSync(address, IN_REG);

        const currentValue = this.stackValueMap[level];
        if (rawData !== currentValue) {
          Object.values(this.subscribers)
            .filter((s) => s.address === address)
            .forEach((subscriber) => {
              const { id, mask, callback } = subscriber;

              const value = ~rawData & mask;
              const subscriberValue = this.valueMap[id];
              if (value !== subscriberValue && callback != null) {
                this.valueMap[id] = value;
                callback(value);
              }
            });

          this.stackValueMap[level] = rawData;
        }
      });
    }, [100]);
  }

  dispose() {
    if (this.intervalId != null) {
      clearInterval(this.intervalId);
    }

    this.port.closeSync();
  }
}

module.exports = (bus) => new I2CBus(bus);
