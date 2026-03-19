exports.depends=['params_assignment'];


exports.instrument_mapping=function(){
    // attach a fair rate to each bond or swap that does not have fixed_rate set
    if(!!this.instrument_json.fixed_rate) return null; // instrument has a fixed_rate already
    if(0===this.instrument_json.fixed_rate) return null; // instrument has a fixed_rate already
    if(this.instrument_json.legs) return null; // instrument has legs already
    
    // copy all instrument properties to temporary instrument
    let instr=Object.assign({}, this.instrument_json);
    // set temp fixed rate
    instr.fixed_rate=0;
    
    // create JsonRisk instrument
    instr=JsonRisk.make_instrument(instr);

    // only handle bonds and swaps
    if (!(instr instanceof JsonRisk.Bond) && !(instr instanceof JsonRisk.Swap)) return null;

    const p=new JsonRisk.Params(this.params_json);

    // get fixed rate and store on instrument
    const rate=instr.fair_rate_or_spread(p);
    this.instrument_json.fixed_rate=rate;
}

exports.simulation_once=function(){
    // store fixed rate on instrument result
    if (typeof this.instrument_json.fixed_rate!=='number') return null;
    this.results.fixed_rate=this.instrument_json.fixed_rate;
}

