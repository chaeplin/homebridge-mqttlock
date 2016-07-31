// MQTT Switch Accessory plugin for HomeBridge

'use strict';

var Service, Characteristic;
var mqtt = require("mqtt");

function mqttlockAccessory(log, config) {
  this.log          = log;
  this.name         = config["name"];
  this.url          = config["url"];
  this.client_Id    = 'mqttjs_' + Math.random().toString(16).substr(2, 8);
  this.options      = {
      keepalive: 10,
      clientId: this.client_Id,
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      will: {
           topic: 'WillMsg',
           payload: 'Connection Closed abnormally..!',
           qos: 0,
           retain: false
      },
      username: config["username"],
      password: config["password"],
      rejectUnauthorized: false
  };
  this.caption            = config["caption"];
  this.topics             = config["topics"];
  this.payloadname        = config["payloadname"];
  this.payloadon          = config["payloadon"];
  this.payloadoff         = config["payloadoff"];
  this.on                 = true;

  this.service = new Service.LockMechanism(this.name);
  this.service
    .getCharacteristic(Characteristic.LockCurrentState)
      .on('get', this.getStatus.bind(this))

  // connect to MQTT broker
  this.client = mqtt.connect(this.url, this.options);
  var that = this;
  this.client.on('error', function (err) {
      that.log('Error event on MQTT:', err);
  });

  this.client.on('message', function (topic, message) {
    //console.log(that.payloadisjson);
    if (topic == that.topics.getOn) {
        var status = JSON.parse(message);
        that.on = (status[that.payloadname] == that.payloadon ? "lock" : "unlock");
        //console.log('recv msg json: ' + that.on + ' topic: ' + that.topics.getOn);
        that.service.getCharacteristic(Characteristic.LockCurrentState).setValue(that.on, undefined, 'fromSetValue'); 
    }
  });

  this.client.subscribe(this.topics.getOn);
}

module.exports = function(homebridge) {
      Service = homebridge.hap.Service;
      Characteristic = homebridge.hap.Characteristic;
      homebridge.registerAccessory("homebridge-mqttlock", "mqttlock", mqttlockAccessory);
}

mqttlockAccessory.prototype.getStatus = function(callback) {
    callback(null, this.on);
}

mqttlockAccessory.prototype.getServices = function() {
  return [this.service];
}
