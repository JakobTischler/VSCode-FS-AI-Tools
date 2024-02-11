// TEST DATA
const testIni = `//// FAIB A321S P3DV4 Aircraft.cfg version 1.0  FDE: Erez Werber////
//// FLTSIM Sections go here ////

[General]
atc_type=AIRBUS
atc_model=A321
editable=0
performance=
Category=Airplane

[LIGHTS]
//Types: 1=beacon, 2=strobe, 3=navigation, 4=cockpit, 5=landing
light.0=1, 5.998, 0, -5.835, fx_fsreborn_beacon3374
light.1=1, 3.718, 0, 8.5, fx_fsreborn_beacon3374
light.2=2, 0, 0, 0, fx_fsreborn_stab3374
light.3=3, -77.801, 0, 4.645, fx_fsreborn_navwhi3374

[fuel]
// Remove Center1 fuel tank to disable dynamic lights and enable custom light splashes
Center1=-41.4,   0.0, -1.5, 1.0, 0.0
// Uncomment Center2 to enable always on logo lights
//Center2   =  -41.4,   0.0, -1.5, 1.0, 0.0
// Uncomment Center3 to enable always on cabin lights
//Center3   =  -41.4,   0.0, -1.5, 1.0, 0.0
// Uncomment External1 to enable always on navigation lights
//External1   =  -41.4,   0.0, -1.5, 1.0, 0.0
LeftMain=-9.7, -17.2, -3.2, 50, 0          //Longitudinal (feet), Lateral (feet), Vertical (feet), Usable(gallons), Unusable (gallons)
RightMain=-9.7,  17.2, -3.2, 50, 0          //Longitudinal (feet), Lateral (feet), Vertical (feet), Usable(gallons), Unusable (gallons)
fuel_type=2                                   //Fuel type: 1 = Avgas, 2 = JetA
number_of_tank_selectors=1
electric_pump=1
fuel_dump_rate=0.0167                        //Percent of max quantity per second, i.e. about 1 minute for full fuel
External2=0,0,0,2.0,0.5
Center2=-41.4,0.0,-1.5,1.0,0.0
Center3=-41.4,0.0,-1.5,1.0,0.0
External1=-41.4,0.0,-1.5,1.0,0.0 //commentAfterLine`;
