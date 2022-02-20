# **FS AI** Tools

A Visual Studio Code extension for managing, cleaning and improving FS/Prepar3D AI flightplans, `aircraft.cfg` files as well as `add-ons.cfg` and `scenery.cfg` files. All options are configurable in the extension settings.

## Installation

1. Download the [latest release `.vsix` file](https://github.com/JakobTischler/VSCode-FS-AI-Tools/releases/latest)
2. In VS Code, use the command "Extensions: Install from VSIX..."
3. Select the downloaded `.vsix` file and install
4. Reload window.

---

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
* Add `@` to arrival times (`3/14:31` ➞ `@3/14:31`)
* Remove seconds from flight times (`hh:mm:ss` ➞ `hh:mm`)
* Convert the flightplan to uppercase
* Randomize the flight percentages to between configurable min and max values
* Change definable airport codes to new ones
* Add or remove spaces after `//`
<br>
<br>
<br>

### Change AC# Number
Changes the AC# of the selected `Aircraft_….txt` or `Flightplans_….txt` lines by a user specified amount.

#### Example
* **Old**:
  ```log
  AC#11,450,"Aircraft 1"
  AC#11,450,"Aircraft 2"

  AC#35,450,"Aircraft 3"
  ```
* **New**, with change = 510:
  ```log
  AC#521,450,"Aircraft 1"
  AC#521,450,"Aircraft 2"

  AC#545,450,"Aircraft 3"
  ```
* **New**, with change = -5:
  ```log
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
  ```log
  //Aircraft Name 1
  AC#1,N12345,IFR,...
  AC#1,N12345,IFR,...
  AC#2,N12345,IFR,...
  AC#3,N12345,IFR,...

  //Aircraft Name 2
  AC#4,N12345,IFR,...
  ```
* **New**:
  ```log
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

### Create Aircraft
From a list of registrations, use a fltsim entry template file to create entries in the `aircraft.cfg` for each registration. Operator name, ICAO, callsign and author can be supplied (via text input boxes). Also optionally creates folders for those aircraft, and optionally copies texture.cfg to them.
* List of registrations can be the following (> ... < indicate the selection start and end):
  * One block selection of all (1 reg per line, where each item is 7 characters or less)
    ```
    >N12345
     F-ABCD
     ZS-ABC<
	```
  * Multi selection with each reg selected separatedly (where each item is 7 characters or less)
    ```
    >N12345<
    >F-ABCD<
    >ZS-ABC<
	```
  * List of flightplans (selection has to start at "AC#") (reg will be picked out), This is only valid in flightplans.txt files, not in aircraft.txt files.
    ```log
    >AC#1,N12345,1%,5WEEKS,IFR,0/18:59,@0/20:02 ...
     AC#2,F-ABCD,1%,5WEEKS,IFR,0/18:59,@0/20:02 ...
     AC#3,ZS-ABC,1%,5WEEKS,IFR,0/18:59,@0/20:02 ... <
	```
* The template file can have four placeholder types. The placeholders will be replaced with the registrations/user data input.
  * Registration: `{reg}`
  * Operator/Airline: `{operator}`
  * ICAO: `{icao}`
  * Callsign: `{callsign}`
  * Author: `{author}`
* Each input data point is optional. If not supplied, it will be removed from the created entry.
* Each placeholder can have an optional separator that only gets used if the placeholder is used. The separator is anything after a question mark (?), e.g. `{reg? }` means there will be one space after the registration, while `{icao?---}` will have three dashes (-) after the ICAO.
* The new fltsim.X number will be based on the last existing entry number in the aircraft.cfg file.
* The template file has to be in the aircraft folder, on the same hierarchical level as the `aircraft.cfg` file.
* Template file example "fltsim-template.cfg":
  ```cfg
  [fltsim.0]
  title=HTAI Cessna 172 Skyhawk {reg? }{icao?-}{operator}
  sim=HTAI Cessna 172 Skyhawk
  model=
  texture={reg? }{icao?-}{operator}
  atc_airline={callsign}
  ui_manufacturer=Henry Tomkiewicz
  ui_type=Cessna 172 Skyhawk
  ui_variation={reg? }{operator}
  atc_parking_codes={icao?,}GA2J,C172
  atc_parking_types=RAMP
  ui_createdby={author}
  ```
* Template file paths must be added to the "FS AI Tools → Create Aircraft → Templates" setting (`fs-ai-tools.createAircraft.templates`).
  * *If adding them in the JSON settings file, please note that backslashes have to be escaped.*
* The corresponding texture folder creation has three settings:
  * Create folders → Folders will always be created
  * Don't create folders → Folders will never be created
  * Ask everytime → You will be asked everytime you run the "Create Aircraft" function
* If there is a `texture.cfg` file on the same hierarchical level as the `aircraft.cfg`/template file, it can optionally be copied to the newly created folders. This can be toggled in the settings.

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

### Generate Airports
Extracts the airports from a `Flightplans.txt` file, and uses an airports master file (containing every possible airport entry) to create this flightplan's `Airports.txt` file. The file path to the master file must be provided in the `fs-ai-tools.generateAirports.masterAirportsFilePath` setting.
<br>
<br>
<br>

### Rebase AC#s
Sets up a new AC# sequence for the selected aircraft, based on a large and a small step size. Sequential AC#s with the same number will get identical numbers, sequential AC#s with different numbers will get numbers with an increased small step, separations by an empty line will start a new "group" based on the large step size.

Works both with Aircraft.txt and Flightplans.txt files.

#### Example
* **Old**:
  ```log
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
  ```log
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

### Rename Files
Renames the flightplan files ("Aircraft…", "Airports…", "Flightplans…") in the current file's folder to a pre-defined pattern. The pattern can hold different placeholders `{asdf}`, which will then be replaced with user-input data. As in `Create Aircraft` templates, placeholders can have optional suffixes (defined as anything after the `?`) that will be used if the placeholder is actually used, and otherwise omitted. If a placeholder receives an empty value, it will be removed from the filename.

**Example**
`{Base}_{season?_}{icao?_}{name}` will become `Flightplans_Wi2021_AAL_American Airlines.txt`, and respectively `Aircraft…` and `Airports…`.

**Available placeholders**
* `Base` → "Aircraft", "Airports", "Flightplans"
* `base` → "aircraft", "airports", "flightplans"
* `name` → Airline name
* `icao` → ICAO
* `callsign` → Callsign
* `author` → Author name
* `season` → Can be either full season or shortened, will be shortened either way
  * "Summer 2021" → "Su21"
  * "Winter 2020-2021" → "Wi2021"
  * "Winter 2020/2021" → "Wi2021"
  * "Su21" → "Su21"
  * "Wi2021" → "Wi2021"
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
<br>
<br>
<br>

### Show aircraft list
Goes through the Aircraft.txt and Flightplans.txt file and displays a list of used aircraft types, their count, and the number of variations. Optionally shows a "Copy for Google Sheets" button which copies a one-liner list of the counts to the clipboard.

It is recommended to set `window.dialogStyle` to `custom` for best legibility.

Preview:
```
—————————— 20 aircraft ——————————

• Antonov An-124/225: 8× (3 variations)
• Antonov An-22/24/26/28/30/32: 4× (4 variations)
• Antonov An-70/72/74/140/148/158/178: 7× (6 variations)
• Antonov An-12: 1×
```
<br>
<br>
<br>

### Switch FS9 ⟷ FSX
Changes the selected flightplans' days from FS9 to FSX or vice versa. Change direction can be selected each time. *Note the known issues.*

---

## Known Issues

* Clean Flightplan: [seconds aren't removed from TNG times](https://github.com/JakobTischler/VSCode-FS-AI-Tools/projects/3#card-63691307)
* Switch FS9 ⟷ FSX: [Multi-week flightplans with specific week values aren't supported yet](https://github.com/JakobTischler/VSCode-FS-AI-Tools/projects/4#card-64459468)

---

## Release Notes

See [Changelog](CHANGELOG.md)
