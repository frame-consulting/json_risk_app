exports.instrument_mapping=function(){
	const t=this.instrument_json.test_code
	// rate and daycount
	if(t % 2 < 1){
		this.instrument_json.dcc="act/365";
		this.instrument_json.fixed_rate=0.0365;
	}else{
		this.instrument_json.dcc="act/360";
		this.instrument_json.fixed_rate=0.0360;
	}

	// assets and liabilities
	if(t % 4 < 2){
		this.instrument_json.accounting="assets";
	}else{
		this.instrument_json.accounting="liabilities";
		this.instrument_json.notional*=-1;
	}
	
	// calendar
	this.instrument_json.calendar="";

	// tenor
	this.instrument_json.tenor=12;

	// start date
	this.instrument_json.effective_date="2023-12-31";

	// maturities starting from one year
	this.instrument_json.maturity=new Date(2025,0,t*8);
	
	if ('bond'===this.instrument_json.type) return 0;
	// fields for callables

	// call date starting from 6 months
	this.instrument_json.first_exercise_date=new Date(2024,6,t*4);
	this.instrument_json.call_tenor=t % 12;
}
