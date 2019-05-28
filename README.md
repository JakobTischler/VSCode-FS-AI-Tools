# FS AI Tools

A handful of tools to format and clean up `Aircraft.cfg`, `Aircraft_….txt` and `Flightplans_….txt` files. All options are configurable in the extension settings.

## Features

### Clean Aircraft.cfg
* Renumber `fltsim.x` entries
* Convert `atc_airline` callsigns to uppercase
* Remove unnecessary lines:
  * `atc_flight_number=…`
  * `atc_heavy=0` (only `0`, not `1`)
  * `atc_id=` (if no reg is set)
  * `atc_id_color=…`
  * `visual_damage=…`
* Trim empty lines after a `fltsim.x` section so there's exactly one empty line between sections

### Clean Flightplans_….txt
* Add leading zeroes to flightnumbers so they have 4 digits (`12` ➞ `0012`)
* Add leading zeroes to flight levels so they have 3 digits (`70` ➞ `070`)
* Add `@` to departure times (`3/14:31` ➞ `@3/14:31`)
* Remove seconds from flight times (`hh:mm:ss` ➞ `hh:mm`)
* Convert the flightplan to uppercase
* Randomize the flight percentages to between configurable min and max values

### Change AC# Number
Changes the AC# of the selected `Aircraft_….txt` or `Flightplans_….txt` lines by a user specified amount.

---

## Known Issues

`Clean Aircraft.cfg` is still a little ... *unsmart*. If there are empty lines between `fltsim` entry settings, it doesn't remove them. Also, it's incapable of sorting `fltsim` entry settings at the moment. I plan to rewrite the setup for this in the future.

---

## Release Notes

### 1.0.4

- All options are now configurable in the extension settings.

### 1.0.3

- *Clean Flightplan* now also pads flight levels to 3 digits (`70` becomes `070`).

### 1.0.2

- *Clean Aircraft.cfg* now also removes `atc_flight_number=…` and `atc_id=`

### 1.0.1

- Context menu commands limited to corresponding file name/type (i.e. *Clean Aircraft.cfg* limited to `aircraft.cfg` files, *Clean Flightplans* to `flightplans_...txt` files etc.)

### 1.0.0

- Initial release. Includes *Clean Aircraft.cfg*, *Clean Flightplan* and *Change AC# Number*
