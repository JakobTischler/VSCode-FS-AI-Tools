# Change Log

### 1.0.14
- New function `Count Aircraft`. Counts how many aircraft there are after a `//Aircraft name` line and appends that line with `[count]`.

### 1.0.13
- New function `Create Header from aifp.cfg`. Checks for an "aifp.cfg" file in same directory as current flightplan, and parses the data to create the flightplan header.

### 1.0.12
- Reworked `Rebase AC#s` to including group steps and single steps. Groups are determined by empty line separation. E.g. group step size can be 10, single aircraft step size can be 1. When a new group is found, the number will jump up to the nearest group step size.

### 1.0.11
- New function: `Create aifp.cfg File`. Creates an aifp.cfg file in the flightplan's folder, based on flightplan header information<br />
  Formatting example:
  ```
  //FSXDAYS=FALSE
  //Irish Air Corps | IRL | "IRISH"/"SHADOW"
  //Phil Evans, Wi2021
  ```
  If multiple callsigns are defined, the first one is used.

### 1.0.10
- New function: `Rebase AC#s`. Rebases the AC#s in the selected text to a new input number. Every different AC# will be based on the initial start value, with a user defined step size.

### 1.0.9
- `Change airports`: each airport set can now be entered as a separate item (replacing the "one long string" idea from the olden times). The min supported VS Code version has been increased to 1.37.0 for this to work.

### 1.0.8
- Added an option to move `ui_createdby` to the bottom when sorting `fltsim` entries during cleaning `aircraft.cfg` files.
- New function: `Create Flightplan Header`. Uses a series of text input boxes to created a three-line header with flightplan data (name, icao, callsign, author, season).
  Preview:
  ```js
  //FSXDAYS=FALSE
  //DC Aviation | DCS | "TWIN STAR"
  //Morten Blindheim, Su19
  ```

### 1.0.7

- Added an option to replace airport ICAO codes with new ones in `Flightplans.txt` files as part of the `Clean Flightplan` command. Check the extension settings for more info.

### 1.0.6

- `Renumber scenery.cfg` added. Renumbers the `[Area.xxx]` entries sequentially and sets the `Layer=x` properties to the same number.
- `Renumber add-ons.cfg` added. Renumbers the `[Package.x]` entries sequentially.

### 1.0.5

- `Clean Aircraft.cfg` rewritten completely, can now take care of empty lines and sort entry lines.

## 1.0.4

- All options are now configurable in the extension settings.

## 1.0.3

- *Clean Flightplan* now also pads flight levels to 3 digits (`70` becomes `070`).

## 1.0.2

- *Clean Aircraft.cfg* now also removes `atc_flight_number=…` and `atc_id=`

## 1.0.1

- Context menu commands limited to corresponding file name/type (i.e. *Clean Aircraft.cfg* limited to `aircraft.cfg` files, *Clean Flightplans* to `flightplans_...txt` files etc.)

## 1.0.0

- Initial release. Includes *Clean Aircraft.cfg*, *Clean Flightplan* and *Change AC# Number*

