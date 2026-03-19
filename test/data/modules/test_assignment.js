exports.instrument_mapping=function(){
    // set curve
    this.instrument_json.disc_curve="CONST_CURVE";
	if (this.instrument_json.type==="bond") return 0;
	// set more params for callables
    this.instrument_json.fwd_curve="CONST_CURVE";
    this.instrument_json.surface="CONST_SURFACE"
}
