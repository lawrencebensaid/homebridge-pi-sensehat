'use strict';

const { exec } = require("child_process");

let Service, Characteristic, CommunityTypes;
let power, brightness, saturation, hue;
let temperature, humidity, pressure;
let path;

const DEFAULT_PATH = "/usr/lib/node_modules/homebridge-pi-sensehat";


/**
 * @author Lawrence Bensaid <lawrencebensaid@icloud.com>
 * @since 1.0.0
 * 
 * @description Manager class of the LED panel on the Sense HAT.
 */
class SenseHatLight {

  constructor(log, config) {
    this.log = log;
    this.name = config.name || this.name;
    path = config.path || DEFAULT_PATH;

    hue = 360;
    brightness = 100;
    saturation = 100;
    power = 1;

    setLEDPanel(log);

    this.ledsService = new Service.Lightbulb(this.name);

    this.ledsService
      .getCharacteristic(Characteristic.On)
      .on("get", this.getPower.bind(this))
      .on("set", this.setPower.bind(this));

    this.ledsService
      .addCharacteristic(new Characteristic.Brightness())
      .on("get", this.getBrightness.bind(this))
      .on("set", this.setBrightness.bind(this));

    this.ledsService
      .addCharacteristic(new Characteristic.Saturation())
      .on("get", this.getSaturation.bind(this))
      .on("set", this.setSaturation.bind(this));

    this.ledsService
      .addCharacteristic(new Characteristic.Hue())
      .on("get", this.getHue.bind(this))
      .on("set", this.setHue.bind(this));

  }

  async setPower(state, cb) {
    power = state ? 1 : 0;
    try {
      await setLEDPanel(this.log)
    } catch (error) {
      this.log.error(error);
    }
    cb(null, power);
  }

  async setBrightness(level, cb) {
    brightness = level;
    try {
      await setLEDPanel(this.log)
    } catch (error) {
      this.log.error(error);
    }
    cb(null, brightness);
  }

  async setSaturation(level, cb) {
    saturation = level;
    try {
      await setLEDPanel(this.log)
    } catch (error) {
      this.log.error(error);
    }
    cb(null, saturation);
  }

  async setHue(level, cb) {
    hue = level;
    try {
      await setLEDPanel(this.log)
    } catch (error) {
      this.log.error(error);
    }
    cb(null, hue);
  }

  getPower(cb) {
    cb(null, power);
  }

  getBrightness(cb) {
    cb(null, brightness);
  }

  getSaturation(cb) {
    cb(null, saturation);
  }

  getHue(cb) {
    cb(null, hue);
  }

  getServices() {
    const info = new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Manufacturer, "Lawrence Bensaid")
      .setCharacteristic(Characteristic.Model, "Sense HAT - LED Panel")
      .setCharacteristic(Characteristic.SerialNumber, "08C0D57A6414");
    return [info, this.ledsService];
  }

}


/**
 * @author Lawrence Bensaid <lawrencebensaid@icloud.com>
 * @since 1.0.0
 * 
 * @description Manager class of the temperature sensor on the Sense HAT.
 */
class SenseHatThermometer {

  constructor(log, config) {
    this.log = log;
    this.name = config.name || this.name;
    path = config.path || DEFAULT_PATH;

    readSensors(log);

    this.temperatureService = new Service.TemperatureSensor(this.name);
    this.temperatureService
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on("get", this.getCurrentTemperature.bind(this));

    // 3rd party support
    this.temperatureService.addCharacteristic(CommunityTypes.AtmosphericPressureLevel);
    this.temperatureService.getCharacteristic(CommunityTypes.AtmosphericPressureLevel)
      .on("get", this.getCurrentPressure.bind(this));

  }

  async getCurrentTemperature(cb) {
    try {
      await readSensors(this.log)
    } catch (error) {
      this.log.error(error);
    }
    cb(null, temperature);
  }

  async getCurrentPressure(cb) {
    try {
      await readSensors(this.log)
    } catch (error) {
      this.log.error(error);
    }
    cb(null, pressure);
  }

  getServices() {
    const info = new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Manufacturer, "Lawrence Bensaid")
      .setCharacteristic(Characteristic.Model, "Sense HAT - Thermometer")
      .setCharacteristic(Characteristic.SerialNumber, "08C0D57A6415");
    return [info, this.temperatureService];
  }

}


/**
 * @author Lawrence Bensaid <lawrencebensaid@icloud.com>
 * @since 1.0.0
 * 
 * @description Manager class of the pressure and humidity sensor on the Sense HAT.
 */
class SenseHatSensors {

  constructor(log, config) {
    this.log = log;
    this.name = config.name;
    path = config.path || DEFAULT_PATH;

    readSensors(log);

    this.humidityService = new Service.HumiditySensor(this.name);
    this.humidityService
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on("get", this.getCurrentRelativeHumidity.bind(this));

    this.airQualityService = new Service.AirQualitySensor(this.name);
    this.airQualityService
      .getCharacteristic(Characteristic.AirParticulateDensity)
      .on("get", this.getCurrentPressure.bind(this));

    // 3rd party support
    this.pressureService = new CommunityTypes.AtmosphericPressureSensor(this.name);
    this.pressureService
      .getCharacteristic(CommunityTypes.AtmosphericPressureLevel)
      .on("get", this.getCurrentPressure.bind(this));

  }

  async getCurrentRelativeHumidity(cb) {
    try {
      await readSensors(this.log)
    } catch (error) {
      this.log.error(error);
    }
    cb(null, humidity);
  }

  async getCurrentPressure(cb) {
    try {
      await readSensors(this.log)
    } catch (error) {
      this.log.error(error);
    }
    cb(null, pressure);
  }

  getServices() {
    const info = new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Manufacturer, "Lawrence Bensaid")
      .setCharacteristic(Characteristic.Model, "Sense HAT - Sensor array")
      .setCharacteristic(Characteristic.SerialNumber, "08C0D57A6416");
    return [info, this.humidityService, this.airQualityService, this.pressureService];
  }

}


/**
 * @description Updates the sensor readings.
 * 
 * @param {function} log 
 * @returns {Promise}
 */
function readSensors(log) {
  return new Promise((resolve, reject) => {
    const cmd = `python ${path}/update-sensors.py`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      const values = `${stdout}`.split(" ");
      const temperature_ = parseFloat(values[1]);
      const humidity_ = parseFloat(values[1]);
      const pressure_ = parseFloat(values[2]) - 1000;
      if (temperature_ && temperature_ > 0) temperature = temperature_;
      if (humidity_ && humidity_ > 0) humidity = humidity_;
      if (pressure_ && pressure_ > 0) pressure = pressure_;
      log.info(`temperature: ${temperature}; humidity: ${humidity}; pressure: ${pressure}`);
      resolve();
    });
  });
}


/**
 * @description Sets the LED panel according to specified values.
 * 
 * @param {function} log 
 * @returns {Promise}
 */
function setLEDPanel(log) {
  return new Promise((resolve, reject) => {
    log.info(`power: ${power ? "ON" : "OFF"}; brightness: ${brightness}; hue: ${hue}; sat: ${saturation}`);
    const adjustedBrightness = (brightness / 100 * 81) + 19; // To make sure the LED panel doesn't turn off below a brightness of 20.
    const cmd = `python ${path}/update-ledpanel.py ${hue} ${saturation} ${adjustedBrightness} ${power}`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}


module.exports = api => {

  Service = api.hap.Service;
  Characteristic = api.hap.Characteristic;
  CommunityTypes = require("hap-nodejs-community-types")(api);

  api.registerAccessory("SenseHatLight", SenseHatLight);
  api.registerAccessory("SenseHatThermometer", SenseHatThermometer);
  api.registerAccessory("SenseHatSensors", SenseHatSensors);

};