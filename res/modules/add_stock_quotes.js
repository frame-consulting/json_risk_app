// adds the stock quote on the instrument into the params object and add reference on the instrument
exports.instrument_mapping=function(){
	// quote must be set on instrument
    const quote=JsonRisk.number_or_null(this.instrument_json.quote);
    if(!quote) return;
    
    // issuer must be set on instruemnt
    const issuer=JsonRisk.string_or_empty(this.instrument_json.issuer);
    if(!issuer) return;
    
    // remove number, add reference  in instrument
    this.instrument_json.quote=issuer;
    
    // make sure scalars is set
    if(!this.params_json.scalars){
    	this.params_json.scalars={};
    }
    
    // do not overwrite any exxisting issuers
    if(issuer in this.params_json.scalars) return;
    
    // add quote
    this.params_json.scalars[issuer]={
    	type: "scalar",
    	tags: ["equity"],
    	value: quote
    }
}
