exports.depends=['valuation', 'common_attributes', 'cashflows', 'test_assignment', 'test_mapping','test_filter'];

exports.simulation_once=function(){
	this.results.notional=this.instrument_json.notional;
}
