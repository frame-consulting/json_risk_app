exports.depends=["params_assignment"];

const get_spread=function(i,p,mval){
	// make instrument
	const instrument=JsonRisk.make_instrument(i);
	const dc=instrument.legs[0].disc_curve;

	// make params object
	const deps = new JsonRisk.Deps();
	instrument.add_deps(deps);
	const params = deps.minimal_params(p);

	// fit spread for market value in instrument currency
	const target=mval*params.get_fx_rate(instrument.currency, params.main_currency);
	const func=(s)=>{
		// create parallel shift with height s
		const rule=new JsonRisk.ScenarioRule({
			model: 'additive',
			labels_x: ['1d'],
			labels_y: ['1d'],
			values: [[s]]
		});

		// attach scenario to disc curve and revaluate		
		params.get_curve(dc).attach_rule(rule);
		const val=instrument.value(params);
		return val - target;
	}
	
	const start=0.0;
	const next=0.01;
	const maxiter=10;
	const tolerance=0.00001;
	return JsonRisk.find_root_secant(func, start, next, maxiter, tolerance);
}

exports.instrument_mapping=function(){
    // market value must be set
    const mval=JsonRisk.number_or_null(this.instrument_json.market_value);
    if(!mval) return;

	// type must be set
	let type=JsonRisk.string_or_empty(this.instrument_json.type);
	if(!type) return;
	
	// only execute for certain bond types
	type=type.replaceAll("_", "").toLowerCase();
	if(false==["bond", "floater", "callablebond"].includes(type)) return;
	
	// try to find spread
	this.instrument_json.residual_spread=get_spread(this.instrument_json, this.params_json, mval);

}

exports.simulation_once=function(){
	const residual_spread=JsonRisk.number_or_null(this.instrument_json.residual_spread);
	if(residual_spread!==null){
		this.results.residual_spread=residual_spread;
	}
}
