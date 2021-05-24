# homebridge-pi-sensehat

A Homebridge plugin for the Sense HAT module for Raspberry Pi.


## Pre-requisites

- Homebridge
- Python
- Python `sense_hat` module


## Setup

`$ npm install homebridge-pi-sensehat`


## Configuration

Parameters:

name|description
---|---
accessory|Options are `SenseHatLight`, `SenseHatThermometer` or `SenseHatSensors`. ****Required***
name|A name for the accessory. **Not required*

Configuration example:

```json
  "accessories": [
    {
      "accessory": "SenseHatLight",
      "name": "Sense Hat LED Panel"
    },
    {
      "accessory": "SenseHatThermometer",
      "name": "Sense Hat Thermometer"
    },
    {
      "accessory": "SenseHatSensors",
      "name": "Sense Hat Sensor"
    }
  ]
```