# **FS AI** Tools

A handful of tools to format and clean up `Aircraft.cfg`, `Aircraft_….txt`, `Flightplans_….txt`, `add-ons.cfg` and `scenery.cfg` files. All options are configurable in the extension settings.

## Features

### Clean Aircraft.cfg
*All changes are configurable.*

* Renumber `fltsim.x` entries
* Convert `atc_airline` callsigns to uppercase
* Remove unnecessary lines (configurable), e.g.:
  * `atc_flight_number=…`
  * `atc_heavy=0` (only `0`, not `1`)
  * `atc_id=` (if no reg is set)
  * `atc_id_color=…`
  * `visual_damage=…`
* Sort entry property lines (configurable)
<br>
<br>
<br>

### Clean Flightplan
*All changes are configurable.*

* Add leading zeroes to flightnumbers so they have 4 digits (`12` ➞ `0012`)
* Add leading zeroes to flight levels so they have 3 digits (`70` ➞ `070`)
* Add `@` to departure times (`3/14:31` ➞ `@3/14:31`)
* Remove seconds from flight times (`hh:mm:ss` ➞ `hh:mm`)
* Convert the flightplan to uppercase
* Randomize the flight percentages to between configurable min and max values
* Change definable airport codes to new ones
<br>
<br>
<br>

### Change AC# Number
Changes the AC# of the selected `Aircraft_….txt` or `Flightplans_….txt` lines by a user specified amount.

#### Example
* **Old**:
  ```
  AC#11,450,"Aircraft 1"
  AC#11,450,"Aircraft 2"

  AC#35,450,"Aircraft 3"
  ```
* **New**, with change = 510:
  ```
  AC#521,450,"Aircraft 1"
  AC#521,450,"Aircraft 2"

  AC#545,450,"Aircraft 3"
  ```
* **New**, with change = -5:
  ```
  AC#6,450,"Aircraft 1"
  AC#6,450,"Aircraft 2"

  AC#30,450,"Aircraft 3"
  ```
<br>
<br>
<br>

### Count Aircraft
Counts the aircraft in each "block" in a flightplans.txt file and appends that count to the block "headline" (where headlines are "//Aircraft name" and blocks are separated by empty lines and a new headline).

#### Example
* **Old**:
  ```
  //Aircraft Name 1
  AC#1,N12345,IFR,...
  AC#1,N12345,IFR,...
  AC#2,N12345,IFR,...
  AC#3,N12345,IFR,...

  //Aircraft Name 2
  AC#4,N12345,IFR,...
  ```
* **New**:
  ```
  //Aircraft Name 1 [4]
  AC#1,N12345,IFR,...
  AC#1,N12345,IFR,...
  AC#2,N12345,IFR,...
  AC#3,N12345,IFR,...

  //Aircraft Name 2 [1]
  AC#4,N12345,IFR,...
  ```
<br>
<br>
<br>

### Create aifp.cfg
Uses the flightplans.txt [Flightplan Header](#create-flightplan-header) data and creates an aifp.cfg file with that data. If the file already exists, all content will be overwritten.
<br>
<br>
<br>

### Create Flightplan Header
Uses a series of text input boxes to created a three-line header with flightplan data (name, icao, callsign, author, season). Tries to read the airline name and ICAO code from the filename.

Preview:
```js
//FSXDAYS=FALSE
//DC Aviation | DCS | "TWIN STAR"
//Morten Blindheim, Su19
```
<br>
<br>
<br>

### Create Flightplan Header from aifp.cfg
Reads the data from an `aifp.cfg` file in the same directory (if present), and uses that data to create the header for the current flightplan file. See [Create Flightplan Header](#create-flightplan-header) for example.
<br>
<br>
<br>

### Rebase AC#s
Sets up a new AC# sequence for the selected aircraft, based on a large and a small step size. Sequential AC#s with the same number will get identical numbers, sequential AC#s with different numbers will get numbers with an increased small step, separations by an empty line will start a new "group" based on the large step size.

Works both with Aircraft.txt and Flightplans.txt files.

#### Example
* **Old**:
  ```
  AC#1,450,"Aircraft 1"
  AC#1,450,"Aircraft 2"
  AC#2,450,"Aircraft 3"
  AC#2,450,"Aircraft 4"
  AC#2,450,"Aircraft 5"

  AC#3,450,"Aircraft 6"
  AC#3,450,"Aircraft 7"
  AC#4,450,"Aircraft 8"

  AC#5,450,"Aircraft 9"
  ```
* **New**, with Start=1000, Large step size=10, small step size=1:
  ```
  AC#1000,450,"Aircraft 1"
  AC#1000,450,"Aircraft 2"
  AC#1001,450,"Aircraft 3"
  AC#1001,450,"Aircraft 4"
  AC#1001,450,"Aircraft 5"

  AC#1010,450,"Aircraft 6"
  AC#1010,450,"Aircraft 7"
  AC#1011,450,"Aircraft 8"

  AC#1020,450,"Aircraft 9"
  ```
<br>
<br>
<br>

### Renumber add-ons.cfg
Renumbers the `[Package.x]` entries sequentially.
<br>
<br>
<br>

### Renumber scenery.cfg
Renumbers the `[Area.xxx]` entries sequentially and sets the `Layer=x` properties to the same number.

---

## Known Issues

* Clean Flightplan: seconds aren't removed from TNG times

---

## Release Notes

See [Changelog](CHANGELOG.md)
