# **FS AI** Tools

A handful of tools to format and clean up `Aircraft.cfg`, `Aircraft_….txt`, `Flightplans_….txt`, `add-ons.cfg` and `scenery.cfg` files. All options are configurable in the extension settings.

## Features

### Clean Aircraft.cfg
* Renumber `fltsim.x` entries
* Convert `atc_airline` callsigns to uppercase
* Remove unnecessary lines (configurable), e.g.:
  * `atc_flight_number=…`
  * `atc_heavy=0` (only `0`, not `1`)
  * `atc_id=` (if no reg is set)
  * `atc_id_color=…`
  * `visual_damage=…`
* Sort entry property lines (configurable)

### Clean Flightplans_….txt
* Add leading zeroes to flightnumbers so they have 4 digits (`12` ➞ `0012`)
* Add leading zeroes to flight levels so they have 3 digits (`70` ➞ `070`)
* Add `@` to departure times (`3/14:31` ➞ `@3/14:31`)
* Remove seconds from flight times (`hh:mm:ss` ➞ `hh:mm`)
* Convert the flightplan to uppercase
* Randomize the flight percentages to between configurable min and max values
* Change definable airport codes to new ones

### Change AC# Number
Changes the AC# of the selected `Aircraft_….txt` or `Flightplans_….txt` lines by a user specified amount.

### Create Flightplan Header
Uses a series of text input boxes to created a three-line header with flightplan data (name, icao, callsign, author, season). Tries to read the airline name and ICAO code from the filename.

Preview:
```js
//FSXDAYS=FALSE
//DC Aviation | DCS | "TWIN STAR"
//Morten Blindheim, Su19
```

### Renumber add-ons.cfg
Renumbers the `[Package.x]` entries sequentially.

### Renumber scenery.cfg
Renumbers the `[Area.xxx]` entries sequentially and sets the `Layer=x` properties to the same number.

---

## Known Issues

*none*

---

## Release Notes

See [Changelog](CHANGELOG.md)
