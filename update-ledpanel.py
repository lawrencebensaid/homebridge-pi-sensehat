#!/usr/bin/python

import sys
import colorsys
from sense_hat import SenseHat

def hsv_to_rgb(h, s, v):
    return tuple(int(i * 255) for i in colorsys.hsv_to_rgb(h, s, v))

sense = SenseHat()

if (len(sys.argv) == 5):
    h = float(sys.argv[1])
    s = float(sys.argv[2])
    v = float(sys.argv[3])
    p = int(sys.argv[4])
    print(h, s, v, p)
    if (p):
        h = h / 360
        s = s / 100
        v = v / 100
        print(h, s, v)
        print(colorsys.hsv_to_rgb(h, s, v))
        rgb = hsv_to_rgb(h, s, v)
        print(rgb)
        sense.clear(rgb)
    else:
        sense.clear(0, 0, 0)
# else:
#     print('Invalid arguments');