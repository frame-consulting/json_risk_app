function dateformat(d){
	return  d.getFullYear()
		+ "-"
		+ ("0"+(d.getMonth()+1)).slice(-2)
		+ "-"
		+ ("0" + d.getDate()).slice(-2);
}

function add_cashflow(date, amount, target){
    if (amount==0) return;
	let key=dateformat(date);
	if (!target[key]){
		target[key]=amount;
	}else{
		target[key]+=amount;
	}
	if(0===target[key]) delete target[key];
}

// must run valuation for cashflows to reflect the right projected rates
exports.depends=['valuation'];

exports.simulation_once=function(){
    if (!("legs" in this.instrument)) return;
    const legs=this.instrument.legs;

	let cashflow={},interest_cashflow={},principal_cashflow={};
    for (const leg of legs){
        for (const p of leg.payments){
            add_cashflow(p.date_pmt, p.amount, cashflow);
            add_cashflow(p.date_pmt, p.amount_interest, interest_cashflow);
            add_cashflow(p.date_pmt, p.amount_notional, principal_cashflow);
        }
    }
	this.results.cashflow=cashflow;
	this.results.interest_cashflow=interest_cashflow;
	this.results.principal_cashflow=principal_cashflow;
};	
