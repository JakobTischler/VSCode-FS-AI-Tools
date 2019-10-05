# Change Log

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

