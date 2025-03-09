exports.depends=['params_assignment'];

function get_curve(name,params){
    let vec_curve=params.curves[name];
    if (!vec_curve) return null;
    
    return Object.assign({}, vec_curve, {
      dfs: vec_curve.dfs
        ? vec_curve.dfs[0]
        : null,
      zcs: vec_curve.zcs
        ? vec_curve.zcs[0]
        : null,
    });
}

exports.instrument_mapping=function(){
    // attach a fair rate to each bond or swap that does not have fixed_rate set
    if('swap'!==this.instrument.type && 'bond' !== this.instrument.type) return null; //only swaps and bonds so far
    if(!!this.instrument.fixed_rate) return null; // instrument has a fixed_rate already
    if(0===this.instrument.fixed_rate) return null; // instrument has a fixed_rate already
    
    // copy all instrument properties to temporary instrument
    let instr=Object.assign({}, this.instrument);
    // set temp fixed rate
    instr.fixed_rate=0;

    let obj,rate,dc,sc,fc;
    dc=get_curve(instr.disc_curve, this.params);
    if(!dc) return null;
    if('bond'===instr.type){
        sc=get_curve(instr.spread_curve,this.params);
        obj=new JsonRisk.fixed_income(instr)
        rate=obj.fair_rate_or_spread(dc,sc);
    }
    
    if('swap'===instr.type){
        fc=get_curve(instr.fwd_curve,this.params);
        if(!fc) return null;
        obj=new JsonRisk.swap(instr)
        rate=obj.fair_rate(dc,fc);
    }
    
    this.instrument.fixed_rate=rate;
}

exports.simulation_once=function(){
    // store fixed rate on instrument
    if (typeof this.instrument.fixed_rate!=='number') return null;
    this.results.fixed_rate=this.instrument.fixed_rate;
}

