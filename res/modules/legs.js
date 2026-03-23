exports.simulation_once=function(){
    if (!("legs" in this.instrument)) return;
    
    // evaluate leg instrument to project non-fix payments and calculate payment pvs
    this.instrument.value(this.params);
    
    // attach legs JSON to results object
    this.results.legs=this.instrument.legs.map(l=>l.toJSON());
};
