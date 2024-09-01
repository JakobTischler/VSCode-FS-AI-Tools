# **FS AI** Tools

A [Visual Studio Code](https://code.visualstudio.com/) extension for managing, cleaning and improving FS/Prepar3D AI flightplans, `aircraft.cfg` files as well as `add-ons.cfg` and `scenery.cfg` files. All options are configurable in the extension settings.

![](https://user-images.githubusercontent.com/748857/213280882-29b8bc51-1c3d-436a-83d1-47094d026915.png)

---

## Features

* [Airline View](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Airline-View): Beautiful overview of fleet and routes
* [Change AC# Number](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Change-AC%23-Number): increases or decreases AC#s
* [Clean Aircraft.cfg](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Clean-Aircraft.cfg): cleans all fltsim entries
* [Clean Flightplan](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Clean-Flightplan): cleans the flightplan's numbers and airports
* [Convert to weekly flightplan](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Convert-to-weekly-flightplan): from "24HR" to "WEEK"
* [Count Aircraft](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Count-Aircraft): adds an aircraft count label for each aircraft group
* [Create aifp.cfg](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Create-aifp.cfg): creates an aifp.cfg file from metadata
* [Create Aircraft](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Create-Aircraft): creates fltsim entries and texture folders for each selected aircraft registration
* [Create Flightplan Header](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Create-Flightplan-Header): creates custom metadata at the beginning of the flightplan
* [Create Flightplan Header from aifp.cfg](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Create-Flightplan-Header-from-aifp.cfg): creates custom metadata at the beginning of the flightplan using the aifp.cfg file
* [Delete Aircraft](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Delete-Aircraft): finds and deletes fltsim entries and texture folders
* [Generate Airports](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Generate-Airports): generates the flightplan's airports.txt file
* [Group by Aircraft Type](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Group-by-Aircraft-Type): separates the aircraft by type and sorts by wingspan
* [Match AC#s](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Match-AC#s): checks for matching registration in source flightplan and uses its AC#
* [Rebase AC#s](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Rebase-AC#s): renumbers the AC#s into number groups
* [Rename Files](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Rename-Files): renames the flightplan files to a pre-defined pattern
* [Renumber add ons.cfg](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Renumber-add-ons.cfg): renumbers the [Package.x] entries
* [Renumber scenery.cfg](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Renumber-scenery.cfg): renumbers the [Area.xxx] entries
* [Replace aircraft in other flightplan](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Replace-aircraft-in-other-flightplan)
* [Show aircraft list](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Show-aircraft-list): displays a list of aircraft types in the flightplan
* [Switch FS9 ⟷ FSX](https://github.com/JakobTischler/VSCode-FS-AI-Tools/wiki/Feature:-Switch-FS9-⟷-FSX): changes the flightplan's days into the FS9/FSX format

---

## Installation

1. Download the [latest release `.vsix` file](https://github.com/JakobTischler/VSCode-FS-AI-Tools/releases/latest)
2. In VS Code, use the command "Extensions: Install from VSIX..."
3. Select the downloaded `.vsix` file and install
4. Reload window.

---

## Known Issues

* Switch FS9 ⟷ FSX: [Multi-week flightplans with specific week values aren't supported yet](https://github.com/JakobTischler/VSCode-FS-AI-Tools/projects/4#card-64459468)

---

## Release Notes

See [Changelog](CHANGELOG.md)
