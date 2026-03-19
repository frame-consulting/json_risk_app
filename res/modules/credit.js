exports.depends=['cashflows'];

function rating_to_pd(instrument){
    // set probability of default based on rating
	const rating=instrument.rating || 'NR';
	let pd=null;	
	switch (rating){
		case 'AAA':
			pd=0.0001;
			break;
		case 'AA':
			pd=0.0003;
			break;
		case 'A':
			pd=0.0007;
			break;
		case 'BBB':
			pd=0.0017;
			break;
		case 'BB':
			pd=0.0059;
			break;
		case 'B':
			pd=0.0198;
			break;
		case 'CCC':
			pd=0.0667;
			break;
	}
	return pd;
}

// seedable random number generator - uniform distribution
function sfc32(seed_text) {
	let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < seed_text.length; i++) {
        k = seed_text.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;

	h1 = h1 >>> 0;
	h2 = h2 >>> 0;
	h3 = h3 >>> 0;
	h4 = h4 >>> 0;

    return function() {
      h1 |= 0; h2 |= 0; h3 |= 0; h4 |= 0; 
      var t = (h1 + h2 | 0) + h4 | 0;
      h4 = h4 + 1 | 0;
      h1 = h2 ^ h2 >>> 9;
      h2 = h3 + (h3 << 3) | 0;
      h3 = (h3 << 21 | h3 >>> 11);
      h3 = h3 + t | 0;
      return ((t >>> 0)+0.5) / 4294967297;
    }
}

// seedable random number generator - normal distribution
function boxmuller(seed_text){
	let r=sfc32(seed_text);	
	return function(){
		return Math.sqrt( -2.0 * Math.log( r() ) ) * Math.cos( 2.0 * Math.PI * r() );
	}
}

function obligo(vd, cf){
	let res=0;
	for (let d of Object.keys(cf)){
		if (JsonRisk.date_or_throw(d)<=vd) continue; // past cashflow
		res+=cf[d]; // future cashflow
	}
	return res>0 ? res : 0;
}

exports.simulation_once=function(){
    // brief credit portfolio model
	const N=this.num_scenarios;
    const credit_loss=new Array(N);

	// get obligo and recovery
	if (!this.results.principal_cashflow) return;
	this.results.obligo=obligo(this.params.valuation_date, this.results.principal_cashflow);
	let recovery=0.5;

	// map pd and rating
	let pd=rating_to_pd(this.instrument_json);
	this.results.rating=this.instrument_json.rating || 'NR';
	if(!pd) return; // instrument is not rated, give up	
	this.results.expected_credit_loss=this.results.obligo*(1-recovery)*pd;

	
	// simulate
	let random_global=boxmuller("" + this.params.valuation_date); // global economy is always the same, initialize based on valuation date
	let random_address=boxmuller("" + this.instrument_json.id) // address has individual randomness (to do: initialize randomness based on address identifier instead of id)
	let r,loss;
	let e_global=0.5;
	let w_global=Math.sqrt(e_global);
	let w_address=Math.sqrt(1-e_global);
	for (let i=0;i<N;i++){
		loss=0;
		r=w_global*random_global()+w_address*random_address();
		if(JsonRisk.cndf(r)<pd) loss=this.results.obligo*(1-recovery); // address defaults if random toss has probability below PD
		credit_loss[i]=loss;
	}
	this.results.credit_loss=credit_loss;
};
