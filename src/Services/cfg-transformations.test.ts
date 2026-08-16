import assert from 'node:assert/strict';
import { cleanAircraftCfg, renumberAddOnsCfg, renumberSceneryCfg } from './cfg-transformations';

describe('configuration-file transformations', () => {
	it('renumbers add-ons packages case-insensitively', () => {
		assert.equal(renumberAddOnsCfg('[Package.8]\nPath=A\n\n[package.42]\nPath=B'), '[Package.0]\nPath=A\n\n[Package.1]\nPath=B');
	});

	it('renumbers scenery areas and their layers', () => {
		assert.equal(renumberSceneryCfg('[Area.42]\nTitle=One\nLayer=99\n\n[area.3]\nLayer=2'), '[Area.001]\nTitle=One\nLayer=1\n\n[Area.002]\nLayer=2');
	});

	it('cleans, sorts, and renumbers fltsim entries while preserving other sections', () => {
		const input = '[General]\natc_type=AIRPLANE\n\n[fltsim.7]\ntexture=Blue\natc_airline=speed bird\nempty=\nremove=this\n\n[FLTSIM.12]\ntitle=Second';
		const output = cleanAircraftCfg(input, {
			removeUnusedLines: true,
			removeUnusedLinesItems: ['empty=_', 'remove=this'],
			callsignsUppercase: true,
			renumber: true,
			sortProperties: true,
			sortPropertiesOrder: ['title', 'texture', 'atc_airline'],
		});
		assert.equal(output, '[General]\natc_type=AIRPLANE\n\n[fltsim.0]\ntexture=Blue\natc_airline=SPEED BIRD\n\n[fltsim.1]\ntitle=Second\n');
	});

	it('preserves property values containing equals signs', () => {
		const output = cleanAircraftCfg('[fltsim.0]\ndescription=a=b', {
			removeUnusedLines: false,
			removeUnusedLinesItems: [],
			callsignsUppercase: false,
			renumber: false,
			sortProperties: false,
			sortPropertiesOrder: [],
		});
		assert.equal(output, '[fltsim.0]\ndescription=a=b\n');
	});
});
