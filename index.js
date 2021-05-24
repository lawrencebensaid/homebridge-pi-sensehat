'use strict';

const { exec } = require("child_process");
const { sync: hat } = require("sense-hat-led");

let Service, Characteristic, CommunityTypes;
let blinker, blink, power, brightness, saturation, hue;
let temperature, humidity, pressure;
let path, useBlinker;
let ledPanel, color;

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
    useBlinker = !!config.blinker;

    hue = 0;
    brightness = 100;
    saturation = 100;
    power = true;

    ledPanel = new LEDPanel(hat);

    (async () => {
      color = Color.magenta;
      const sleep = async (x) => new Promise(resolve => setTimeout(resolve, x));
      for (const x of [...Array(7).keys()]) {
        ledPanel.setPixel(x, 0, color);
        await sleep(100);
      }
      for (const x of [...Array(7).keys()]) {
        ledPanel.setPixel(7, x, color);
        await sleep(100);
      }
      for (const x of [...Array(7).keys()].reverse()) {
        ledPanel.setPixel(x, 7, color);
        await sleep(100);
      }
      for (const x of [...Array(7).keys()].reverse()) {
        ledPanel.setPixel(0, x, color);
        await sleep(100);
      }
      ledPanel.off();
      await sleep(500);
      ledPanel.fill(Color.green);
      await sleep(500);
      ledPanel.off();
      await sleep(500);
      ledPanel.fill(Color.green);
      await sleep(500);
      ledPanel.off();
      await sleep(500);
      ledPanel.fill(Color.green);
      await sleep(500);
      ledPanel.off();
    })();

    if (useBlinker) {

      this.blinkerService = new Service.Switch(this.name);

      this.blinkerService
        .getCharacteristic(Characteristic.On)
        .on("get", this.getBlinker.bind(this))
        .on("set", this.setBlinker.bind(this));

    }

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

  async setBlinker(state, cb) {
    ledPanel.blink(state);
    cb(null, ledPanel.isBlinking);
  }

  async setPower(state, cb) {
    if (state) {
      ledPanel.on();
    } else {
      ledPanel.off();
    }
    cb(null, ledPanel.power);
  }

  async setBrightness(level, cb) {
    color.setValue(level / 100);
    ledPanel.fill(color);
    cb(null, color.value * 100);
  }

  async setSaturation(level, cb) {
    color.setSaturation(level / 100);
    ledPanel.fill(color);
    cb(null, color.saturation * 100);
  }

  async setHue(level, cb) {
    color.setHue(level / 360);
    ledPanel.fill(color);
    cb(null, color.hue * 360);
  }

  getBlinker(cb) {
    cb(null, ledPanel.isBlinking);
  }

  getPower(cb) {
    cb(null, ledPanel.power);
  }

  getBrightness(cb) {
    cb(null, color.value * 100);
  }

  getSaturation(cb) {
    cb(null, color.saturation * 100);
  }

  getHue(cb) {
    cb(null, color.hue * 360);
  }

  /**
   * @description To make sure the LED panel doesn't turn off below a brightness of 20.
   * 
   * @returns {number}
   */
  // encodeBrightness(x) {
  //   return (x / 100 * 81) + 19;
  // }

  // decodeBrightness(x) {
  //   return (x / 119 * 100) - 19;
  // }

  getServices() {
    const info = new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Manufacturer, "Lawrence Bensaid")
      .setCharacteristic(Characteristic.Model, "Sense HAT - LED Panel")
      .setCharacteristic(Characteristic.SerialNumber, "08C0D57A6414");
    const services = [info, this.ledsService];
    if (this.blinkerService) {
      services.push(this.blinkerService);
    }
    return services;
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
      const temperature_ = parseFloat(values[0]);
      const humidity_ = parseFloat(values[1]);
      const pressure_ = parseFloat(values[2]) - 1000;
      if (temperature_ && temperature_ > 0 && temperature_ < 100) temperature = temperature_;
      if (humidity_ && humidity_ > 0) humidity = humidity_;
      if (pressure_ && pressure_ > 0) pressure = pressure_;
      log.info(`temperature: ${temperature}; humidity: ${humidity}; pressure: ${pressure}`);
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


/**
 * @author Lawrence Bensaid <lawrencebensaid@icloud.com>
 * 
 * @description
 */
class LEDPanel {

  constructor(hat) {
    this.hat = hat;
    this.power = true;
    this.state = Color.green;
    this.isBlinking = false;
  }

  blink(state = true, delay = 500) {
    this.isBlinking = state;
    clearInterval(this.interval);
    if (state) {
      this.interval = setInterval(() => {
        blink = !blink;
        this.hat.clear(blink ? this.state.rgb().map(x => Math.round(x * 255)) : [0, 0, 0]);
      }, delay);
    } else {
      blink = null;
      this.interval = null;
    }
  }

  off() {
    this.power = false;
    this.hat.clear(0, 0, 0);
  }

  on() {
    if (!(this.state instanceof Color)) {
      this.state = Color.white;
    }
    this.power = true;
    this.hat.clear(this.state.rgb().map(x => Math.round(x * 255)));
  }

  /**
   * @param {Color} color 
   */
  fill(color) {
    if (!(color instanceof Color)) return;
    this.state = color;
    this.hat.clear(color.rgb().map(x => Math.round(x * 255)));
  }

  /**
   * @param {Int} x 
   * @param {Int} y 
   * @param {Color} color 
   */
  setPixel(x, y, color) {
    this.hat.setPixel(x, y, color.rgb().map(x => Math.round(x * 255)));
  }

}


/**
 * @author Lawrence Bensaid <lawrencebensaid@icloud.com>
 * 
 * @description All values are on the scale of 0.0 to 1.0.
 */
class Color {

  constructor(hue, saturation, value) {
    this.setHSV(hue, saturation, value);
  }

  setHSV(hue = 0, saturation = 0, value = 0) {
    this.hue = hue;
    this.saturation = saturation;
    this.value = value;
    var r, g, b, i, f, p, q, t;
    i = Math.floor(hue * 6);
    f = hue * 6 - i;
    p = value * (1 - saturation);
    q = value * (1 - f * saturation);
    t = value * (1 - (1 - f) * saturation);
    switch (i % 6) {
      case 0: r = value, g = t, b = p; break;
      case 1: r = q, g = value, b = p; break;
      case 2: r = p, g = value, b = t; break;
      case 3: r = p, g = q, b = value; break;
      case 4: r = t, g = p, b = value; break;
      case 5: r = value, g = p, b = q; break;
    }
    this.red = r;
    this.green = g;
    this.blue = b;
  }

  setHue(hue) {
    this.setHSV(hue, this.saturation, this.value);
  }

  setSaturation(saturation) {
    this.setHSV(this.hue, saturation, this.value);
  }

  setValue(value) {
    this.setHSV(this.hue, this.saturation, value);
  }

  hsv() {
    return [this.hue, this.saturation, this.value];
  }

  rgb() {
    return [this.red, this.green, this.blue];
  }

}

Color.black = new Color(0, 0, 0);
Color.white = new Color(0, 0, 1);
Color.red = new Color(0, 1, 1);
Color.green = new Color(120 / 360, 1, 1);
Color.blue = new Color(240 / 360, 1, 1);
Color.yellow = new Color(60 / 360, 1, 1);
Color.magenta = new Color(300 / 360, 1, 1);
Color.cyan = new Color(.5, 1, 1);

Color.hsvToRgb = (h, s, v) => {
  var r, g, b, i, f, p, q, t;
  if (arguments.length === 1) {
    s = h.s, v = h.v, h = h.h;
  }
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};
