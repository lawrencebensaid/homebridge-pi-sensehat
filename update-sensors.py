#!/usr/bin/python

import os
from sense_hat import SenseHat

def get_cpu_temperature():
    res = os.popen('vcgencmd measure_temp').readline()
    return float(res.replace('temp=', '').replace("'C\n", ''))

def get_temperature(sense):
    temp_h = sense.get_temperature_from_humidity()
    temp_p = sense.get_temperature_from_pressure()
    temp = (temp_h + temp_p) / 2
    temp_cpu = get_cpu_temperature()
    temp_corr = temp - ((temp_cpu - temp) / 1.5)
    return temp_corr

sense = SenseHat()
humidity = sense.get_humidity()
pressure = sense.get_pressure()

print('%s %s %s' % (get_temperature(sense), humidity, pressure))
