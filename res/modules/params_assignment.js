assign_disc_curve=function(i,p){
	//a curve has already been assigned - no check if it exists
	if(i.disc_curve) return 0;
    
	//need assignment
    let currency=i.currency || 'EUR';
    let cname="";
    if('EUR'==currency) cname='EUR_ESTR';
    if('CHF'==currency) cname='CHF_SARON';
    if('GBP'==currency) cname='GBP_SONIA';
    if('USD'==currency) cname='USD_SOFR';
    if('JPY'==currency) cname='JPY_TONAR';
    if('SEK'==currency) cname='SEK_3M';
    if('NOK'==currency) cname='NOK_3M';
    if('DKK'==currency) cname='DKK_3M';

    // assign
    if(cname in p.curves){
        i.disc_curve=cname;
        return 0;
    }

    // fallback for EUR
    if('EUR'==currency && 'EUR_OIS_DISCOUNT' in p.curves){
        i.disc_curve='EUR_OIS_DISCOUNT';
        return 0;
    }
    return 1;
}

assign_fwd_curve=function(i,p){
	//a curve has already been assigned - no check if it exists
	if(i.fwd_curve) return 0;

    //need assignment
    let currency=i.currency || 'EUR';

    //handle tenors
	let tenor=i.float_tenor || i.tenor || 6;
	switch(tenor){
		case 1:
            cname=currency + "_1M";
            if (!cname in p.curves) cname=currency + "_3M";
            if (!cname in p.curves) cname=currency + "_6M";
			break;
		case 3:
			cname=currency + "_3M";
            if (!cname in p.curves) cname=currency + "_6M";
			break;
        case 6:
            cname=currency + "_6M"
            if (!cname in p.curves) cname=currency + "_3M";
            break;
        case 12:
            cname=currency + "_1Y"
            if (!cname in p.curves) cname=currency + "_6M";
            if (!cname in p.curves) cname=currency + "_3M";
            break;
		default:
			cname=currency + "_6M"
	}
    
	//handle special currencies
    if('JPY'==currency) cname='JPY_TONAR';
    if('CHF'==currency) cname='CHF_SARON';
    if('GBP'==currency) cname='GBP_SONIA';
    if('USD'==currency) cname='USD_SOFR';

    // assign
    if(cname in p.curves){
        i.fwd_curve=cname;
        return 0;
    }

    // fallback for EUR
    if('EUR'==currency && 'EUR_6M_FWD' in p.curves){
        i.fwd_curve='EUR_6M_FWD';
        return 0;
    }
    return 1;
}

assign_surface=function(i,p){

	//a surface has already been assigned
	if(i.surface) return 0;

	//need assignment
	cname="CONST_10BP"; //default surface name
	if(cname in p.surfaces){
		//assign
		i.surface=cname;
        return 0;
	}
    return 1;
}

assign_params=function(i,p){
	switch(i.type.toLowerCase()){
                case "callable_bond":
                case "swaption":
			assign_surface(i,p);
                case "floater":
                case "swap":
			assign_fwd_curve(i,p);
				case "bond":
                case "fxterm":
			assign_disc_curve(i,p);
	}
}

exports.instrument_mapping=function(){
	assign_params(this.instrument_json,this.params_json)
}



