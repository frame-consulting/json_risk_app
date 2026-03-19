exports.simulation_once=function(){
    // prepare pv and pnl vector
	this.results.present_value=new Array(this.num_scen);
    this.results.pnl_scenario=new Array(this.num_scen);
	// evaluate instrument in base scenario
	this.results.present_value[0]=this.instrument.value(this.params);
	// pnl is zero for base scenario
    this.results.pnl_scenario[0] = 0.0;
};

exports.simulation_scenario = function () {
    const i = this.idx_scen;
    // base scenario is handled in simulation_once
    if(i===0) return; 
    // calculate present value
    this.results.present_value[i] = this.instrument.value(this.params);
    // calculate pnl as the difference between scenario present value and base present value
    this.results.pnl_scenario[i] = this.results.present_value[i] - this.results.present_value[0];
};


