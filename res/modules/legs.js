// must run valuation to see projected rates and pvs in cashflows
exports.depends=['valuation'];

exports.simulation_once=function(){
    if (!("legs" in this.instrument)) return;
    
    // copy leg information as plain object - code could be obsolete if leg had a toJSON method
    const legs=this.instrument.legs.map(leg=>{
        return{
            currency: leg.currency,
            payments: leg.payments.map(p=>{
                let {amount,amount_interest,amount_notional,amount_option,capitalize,date_end,date_pmt,date_start,date_value,index,is_fixed,notional,rate,spread,yf,pv}=p;
                
                date_end=JsonRisk.date_to_date_str(date_end);
                date_pmt=JsonRisk.date_to_date_str(date_pmt);
                date_start=JsonRisk.date_to_date_str(date_start);
                date_value=JsonRisk.date_to_date_str(date_value);
                
                let type=p.constructor.name;
                
                return {amount,amount_interest,amount_notional,amount_option,capitalize,date_end,date_pmt,date_start,date_value,index,is_fixed,notional,rate,spread,type,yf,pv};
            })
        };    
    });
    
    // attach legs to results object
    this.results.legs=this.instrument.legs.map(l=>l.toJSON());
};
