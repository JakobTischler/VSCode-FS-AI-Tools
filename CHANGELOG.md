# Change Log

### 1.7.2
- `Group by Aircraft Type`: the aircraft count for each aircraft type can optionally be added to the header line (see `fs-ai-tools.groupByAircraftType.addCountToGroupHeadline`).
- `Group by Aircraft Type`: Livery variations are now extracted from the title to use as livery header lines. Currently supported: " - variation" and " (variation)".

### 1.7.1
- `Create Flightplan Header`, `Create Flightplan Header from aifp.cfg`, `Create aifp.cfg`: New setting `fs-ai-tools.createFlightplanHeader.template` that defines the layout and content of the header - used both when creating the header and when reading it to create the `aifp.cfg` file.
- Config settings sorted alphabetically

### 1.7.0
- `Group by Aircraft Type`: Parses the current file's `aircraft.txt` file to match aircraft titles to aircraft types. Then outouts the data in aircraft type groups. Those groups are separated by a configurable number of empty lines. Additionally, the aircraft types and titles are added as commented header lines in the `flightplans.txt`. Optionally the groups can be sorted by wingspan in a descending order.

### 1.6.2
- `Delete Aircraft`: from user-selected aircraft titles in the `aircraft.txt` file, finds aircraft entries in aircraft.cfg files and removes them as well as their corresponding texture folders.

### 1.6.0
- `Airline View`: Displays an overview of the flightplans airline with aircraft, airport and routing stats, along with a routemap.
- `Convert to weekly flightplan`: Converts flightplans with repeating periods of 24hr and below (12hr, 8hr, ...) to weekly flightplans ("WEEK").
- `Clean flightplan` now removes seconds from TNG legs

### 1.5.1
- `Create aifp.cfg`: handle malformed season (value will be "---")
- New command `Open Master Airports File`: simply opens the master airports file as defined in the `fs-ai-tools.generateAirports.masterAirportsFilePath` setting. Only available from the command palette.
- `Generate Airports` :
  - no longer continues to write the airports file if the "Open master airports file" button is used if airports are missing.
  - The minutes value output in the airports.txt file now uses 2 decimals instead of 4 (before: *`N20* 40.7900'`* → now: *`N20* 40.79'`* ).
- `Count Aircraft`: required number of empty lines between groups (where the counter is resetted) is now configurable in `fs-ai-tools.countAircraft.emptyLinesBetweenGroups`.

### 1.5.0
- New function `Match AC#s`: Takes a source flightplan's AC#s and matches it to a target flightplan's aircraft, using the corresponding registrations.

### 1.4.2
- `Show Airline View` now includes a routemap view, using [Great Circle Mapper](http://www.gcmap.com/). Each aircraft type can be toggled.

### 1.4.1
- `Show Airline View`: now first checks the `Airports….txt` file in the flightplan directory before reading the master airports file.

### 1.4.0
- New function `Show Airline View`: a custom view that shows airline data such as the logo, ICAO code, callsign, author, season, visited airports, used aircraft types as well as routes with distances.
  - Requires an `aifp.cfg` file in the flightplan directory, containing the airline metadata.
  - Logo will be searched in flightplan directory (`logo.png/jpg` or `[callsign].png/jpg`) or a custom logo directory (`directory/[callsign].png/jpg`)
  - Custom logo directory path can be set with the `fs-ai-tools.airlineView.logoDirectoryPath` setting.
  - All data can be sorted.

### 1.3.1
- Rebase AC#s: new settings to define the minimum number of empty lines needed to start a new number group. See `fs-ai-tools.rebaseAircraftNumbers.groupSeparationAircraftTxt` and `fs-ai-tools.rebaseAircraftNumbers.groupSeparationFlightplansTxt`.

### 1.3.0
- New function `Generate Airports`: Extracts the airports from a `Flightplans.txt` file, and uses an airports master file (containing every possible airport entry) to create this flightplan's `Airports.txt` file.
  - The file path to the master file must be provided in the `fs-ai-tools.generateAirports.masterAirportsFilePath` setting.
- Show Aircraft: Better formatting in popup dialog, using title and separate lines
- Clean Flightplan: fixed flight number padding if followed by an airport starting with "F" or "R"
- Increased minimum VSCode version to v1.64.0

### 1.2.2
- Clean Flightplan: Operation fixed (padding flight levels and numbers had a bug that blocked the whole process to go through)

### 1.2.1
- Settings: separated into categories (requires VSCode v1.61.0)

### 1.2.0
- New function `Show Aircraft List`: Goes through the Aircraft.txt and Flightplans.txt file and displays a list of used aircraft types, their count, and the number of variations.
  - Shows a "Copy for Google Sheets" button which copies a one-liner list of the counts to the clipboard. This is for my personal use and I will make this optional in the next release.
  - The data to match the aircraft titles to the actual aircraft types is defined in a [JSON file](./src/data/aircraft-naming.json) within the extension. This will be made configurable or extendable in the future.
  - It is highly recommended to set `window.dialogStyle` to `custom` for best legibility.
- `Clean Aircraft.cfg`:
  - Sort Properties Order option (`fs-ai-tools.cleanAircraftCfg.sortPropertiesOrder`) changed to actual array instead of string list
  - "Change Airports" setting: airport pairs will now be validated (has to use format "XXX(X):YYY(Y)")
- Min version updated to v1.59.0 (required for re-ordering config arrays)
- `Rebase AC#`:
  - Rebasing Aircraft.txt works better when two sequential aircraft have the same AC#. Now each aircraft will definitely have its own, new number.
  - The placeholder value for the start value (1000) is now the first number encountered in the file instead.
  - Now can also be called without any selected text - the whole file will be rebased that way.
- `Rename files`:
  - Can now be called via right click context menu on a file in the explorer
  - Now uses VSCode's internal `renameFile` function, which allows opened files being renamed to stay open, as well as allowing undo the renaming using <kbd>Ctrl</kbd>+<kbd>Z</kbd>

### 1.1.1
- `Switch FS9 ⟷ FSX`: Repeating period are now parsed no matter if they're uppercase, lowercase or a mixture

### 1.1.0
- New function `Switch FS9 ⟷ FSX`: changes the days of selected flightplans to either FSX or FS9 (increase/decrease day number).
- New function `Rename files`: renames the flightplan files ("Aircraft…", "Airports…", "Flightplans…") in the current file's folder to a pre-defined pattern.
- `Clean Flightplan`: new option to add/remove spaces after `//`. See "Clean Flightplan" → "Ajust Comments" setting.
- `Create Aircraft` now checks for aifp.cfg file and pre-enters its values into the input text fields

### 1.0.17
- `Create Aircraft` improvements:
  - Any leading or trailing spaces in a template are now trimmed away (was producing file system errors before)
  - Now also works from unsaved (untitled) documents (e.g. copied list of regs to a new, empty file)
- `Clean Aircraft.cfg`: Fixed "Remove unused lines" case where no value was provided (`key`) (lines weren't deleted before)

### 1.0.16
- New function `Create Aircraft`: From a list of registrations, use a fltsim entry template file to create entries in the aircraft.cfg for each registration. Also optionally create folders for those aircraft, and optionally copy texture.cfg to them.

### 1.0.15
- All functions received configuration settings to show/hide them in the context menu (`Show … in context menu`).
- Rebase AC#s: default start number changed from 1 to 1000
- Count Aircraft: removed from aircraft.txt files (now only available in flightplan.txt files)
- Clean Aircraft.cfg: The sort order is now configurable (see `Clean Aircraft Cfg: Sort Properties Order` in the settings menu). `Sort ui_createdby to bottom` setting has been removed.

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

