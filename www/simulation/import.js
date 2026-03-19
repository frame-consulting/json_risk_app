/*
associated scripts: index.html, main.js, export.js, worker.js, testdata.js (aws lambda function jr_portfoliopricer, aws api jr_portfoliopricer)

structure of export.js

I. functions called by main.js
    load_params_from_server(sc)     imports selected params from jsonrisk-Server
    load_params_list(sc)            loads available params list from jsonrisk-Server
    load_portfolio_dates_list
    load_portfolios_list
    load_portfolios_from_server
    import_data_csv(fil, kind, sc)  imports data to scope (portfolio, curves, ...)
    import_data_json(fil, kind, sc) imports data to scope (portfolio, curves, ...)
 
*/


/* I. functions called by main.js */


var load_params_from_server=function(sc){
	if (!sc.available_params.selection){
		alert("No parameter set selected");
		return 0;
	}
	var req=new XMLHttpRequest();	
	req.addEventListener('load', function(evt){
		if(req.status===200){
            sc.params_count=0;
			sc.params=JSON.parse(req.responseText);
			sc.res=null;
			sc.errors=null;
			sc.warnings=null;
            var keys=Object.keys(sc.params);
            for (j=1;j<keys.length;j++){
                var key=keys[j];
                if (key === 'curves' || key === 'scalars' || key === 'surfaces'){
	                sc.params_count=sc.params_count + (Object.keys(sc.params[key]).length || 0)  ;
                }
            }            
            sc.$apply();
		}else{
			alert("Could not load params from server");
		}
	});

	
	req.addEventListener('error', function(evt){
		alert("Could not load params from server");
	});
	req.open('GET', '/api/params/' + sc.available_params.selection);
	req.send();
}

var load_params_list=function(sc){
	var req=new XMLHttpRequest();	
	req.addEventListener('load', function(evt){
		if(req.status===200){
			sc.available_params.list=JSON.parse(req.responseText);
			sc.available_params.selection=sc.available_params.list[0];
            sc.$apply();                       
		}else{
			//silent error
			console.log("Could not load list of available params from server");
		}
	});	
	req.addEventListener('error', function(evt){
		//silent error
		console.log("Could not load list of available params from server");
	});
	req.open('GET', '/api/params/');
	req.send();	
}

var load_portfolio_dates_list=function(sc){
	var req=new XMLHttpRequest();	
	req.addEventListener('load', function(evt){
		if(req.status===200){
		var tmp;
			tmp=JSON.parse(req.responseText);
			sc.available_portfolio_dates.list=tmp.res;
			sc.available_portfolio_dates.selection=sc.available_portfolio_dates.list[0];
            sc.$apply();
            load_portfolios_list(sc);
		}else{
			//silent error
			console.log("Could not load list of available portfolios from server");
		}
	});	
	req.addEventListener('error', function(evt){
		//silent error
		console.log("Could not load list of available potrfolios from server");
	});
	req.open('GET', '/api/portfolio/');
	req.send();	
}

var load_portfolios_list=function(sc){
	var req=new XMLHttpRequest();	
	req.addEventListener('load', function(evt){
		if(req.status===200){
		var tmp;
			tmp=JSON.parse(req.responseText);
			sc.available_portfolios.list=tmp.res;
			sc.available_portfolios.selection=sc.available_portfolios.list[0];
            sc.$apply();
		}else{
			//silent error
			console.log("Could not load list of available portfolios from server");
		}
	});	
	req.addEventListener('error', function(evt){
		//silent error
		console.log("Could not load list of available portfolios from server");
	});
	req.open('GET', '/api/portfolio/' + sc.available_portfolio_dates.selection);
	req.send();	
}


var load_portfolios_from_server=function(sc){

	var pp_config={
	        header: true,
        	dynamicTyping: true,
	        worker: false,
	        delimiter: "",
	        skipEmptyLines: true
        };

	if (!sc.available_portfolios.selection){
		alert("No parameter set selected");
		return 0;
	}
	var req=new XMLHttpRequest();	
	req.addEventListener('load', function(evt){
		if(req.status===200){
			if(req.getResponseHeader('Content-Type').startsWith('text/csv')){			
				var tmp;
				tmp=Papa.parse(req.responseText,pp_config);		
				if (!sc.portfolio) sc.portfolio=[];
                var i,j, error_found;
                for (i=0; i<tmp.data.length; i++){
    	            error_found=false;
                    for (j=0; j<tmp.errors.length; j++){
	                    if (tmp.errors[j].row===i) error_found=true;
                    }
    	            if (!error_found) sc.portfolio.push(tmp.data[i]);
                }
			}else{
				sc.portfolio=JSON.parse(req.responseText);
			}
							
			sc.res=null;
			sc.errors=null;
			sc.warnings=null;          
            sc.$apply();
		}else{
			alert("Could not load portfolios from server");
		}
	});
	req.open('GET', '/api/portfolio/' + sc.available_portfolio_dates.selection + '/' + sc.available_portfolios.selection.name);
	req.send();
}


var load_modules_list=function(sc){
	var req=new XMLHttpRequest();	
	req.addEventListener('load', function(evt){
		if(req.status===200){
			sc.available_modules.list=JSON.parse(req.responseText).res;
			sc.available_modules.selection=[];			
			// set default modules for convenience
			for (let m of ['valuation', 'params_assignment', 'common_attributes']){
				if (sc.available_modules.list.indexOf(m)>=0) sc.available_modules.selection.push(m);
			}
            sc.$apply();
		}else{
			//silent error
			console.log("Could not load list of available modules from server");
		}
	});	
	req.addEventListener('error', function(evt){
		//silent error
		console.log("Could not load list of available modules from server");
	});
	req.open('GET', '/api/modules/');
	req.send();	
}

var import_data_csv=function(fil, kind, sc){
        var pp_config={
	        header: false,
        	dynamicTyping: true,
	        worker: false,
	        delimiter: "",
	        skipEmptyLines: true
        };
    
        if (kind==="params"){
        }else if (kind==="scalar"){
                pp_config.complete=function(results,file){
                        var i,j;
                        var column;
                        var scenarios=[];
                        if (!sc.params) sc.params={};
                        if (!sc.params.scalars) sc.params.scalars={};    
                        for (j=1;j<results.data[0].length;j++){
                                sc.params_count=sc.params_count+1;
                                column=[];
                                for (i=1; i<results.data.length;i++){
                                        if (results.data[i].length!==results.data[0].length) continue;
                                        scenarios.push(results.data[i][0]);
                                        column.push(results.data[i][j]);
                                }
                                sc.params.scalars[results.data[0][j]]={
                                        type: "equity / fx",
                                        value: column
                                };
                        }
                        if (!sc.params.scenario_names) {
                            sc.params.scenario_names=scenarios;
                        }else{
                            if (scenarios.length > sc.params.scenario_names) sc.params.scenario_names=scenarios;

                        };

                       if (results.data[0].length===1) sc.params_count=sc.params_count+1;
                        sc.$apply();
                }        
        }else if (kind==="curve"){
                pp_config.complete=function(results,file){
                        var i,j;
                        var labels=[];
                        var zcs=[];
                        var row;
                        var scenarios=[];
                        for (j=1;j<results.data[0].length;j++){  //Zeile
                                labels.push(results.data[0][j]);
                        }                     
                        for (i=1; i<results.data.length;i++){    //Spalte 
                                if (results.data[i].length!==results.data[0].length) continue;
                                scenarios.push(results.data[i][0]);
                                row=new Array(results.data[0].length-1);
                                for (j=0;j<row.length;j++){

                                        row[j]=results.data[i][j+1];
                                }
                                zcs.push(row);
                        }
                        
                        if (!sc.params) sc.params={};
                        if (!sc.params.curves) sc.params.curves={};
                        if (!sc.params.scenario_names) {
                            sc.params.scenario_names=scenarios;
                        }else{
                            if (scenarios.length > sc.params.scenario_names) sc.params.scenario_names=scenarios;

                        };
                        sc.params.curves[results.data[0][0]]={
                                type: "yield / spread",
                                labels: labels,
                                zcs: zcs
                        }
                        sc.params_count=sc.params_count + 1;
                        sc.$apply();
                }
        
        }else if (kind==="surface"){
                pp_config.complete=function(results,file){
                        var i,j;
                        var labels_expiry=[];
                        var labels_term=[];
                        var values=[];
                        var row;

                        for (j=1;j<results.data[0].length;j++){

                                labels_term.push(results.data[0][j]);
                        }

                        var tmpexpiry=[];
                        for (i=1; i<results.data.length;i++){  

                                    if (results.data[i].length!==results.data[0].length) continue; 
                                    tmpexpiry.push(results.data[i][0]);
                                    labels_expiry = tmpexpiry.filter((v, i, a) => a.indexOf(v) === i);   
                        }

                        if (Math.round(tmpexpiry.length / labels_expiry.length)!=tmpexpiry.length / labels_expiry.length) {
                                    sc.upload_error="Could not upload surfaces " + results.data[0][0] + ": please check columns and rows.";
                                    sc.$apply();
                                    return 
                        };
                        scenario=new Array(tmpexpiry.length / labels_expiry.length);
                        for (n=0;n<labels_expiry.length;n++) {
                                if (tmpexpiry.filter(x => x === labels_expiry[0]).length!=tmpexpiry.filter(x => x === labels_expiry[n]).length){  // Errorhandling   
                                    sc.upload_error="Could not upload surfaces " + results.data[0][0] + ": different sceanrio count for expiries.";
                                    sc.$apply();
                                    return   
                                }  
                            var k=0;                        
                            for (i=1; i<results.data.length;i++){ 
                                    if (undefined===results.data[i]) continue;
                                    if (results.data[i][0]!==labels_expiry[n]) continue;
                                    if (results.data[i].length!==results.data[0].length){ 
                                        sc.upload_error="Could not upload surfaces " + results.data[0][0] + ": different term count for expiries.";
                                        sc.$apply();
                                        return 
                                    }
                                    if(undefined===scenario[k]) scenario[k]=[];
                                    row=new Array(results.data[0].length-1);  
                                    for (j=0;j<row.length;j++){    
                                            row[j]=results.data[i][j+1]; 
                                    }
                                    scenario[k].push(row); 
                                    delete results.data[i];
                                    k=k+1;
                            }                       
                        }
                        values=scenario;


                        if (!sc.params) sc.params={};
                        if (!sc.params.surfaces) sc.params.surfaces={};
                        sc.params.surfaces[results.data[0][0]]={
                                type: "bachelier",
                                labels_expiry: labels_expiry,
                                labels_term: labels_term,
                                values: values
                        }

                        sc.params_count=sc.params_count + 1;
                        sc.$apply();
                }
        }else if (kind==="portfolio"){
                pp_config.complete=function(results,file){
                        if (!sc.portfolio) sc.portfolio=[];
                        var i,j, error_found;
                        for (i=0; i<results.data.length; i++){
                                error_found=false;
                                for (j=0; j<results.errors.length; j++){
                                        if (results.errors[j].row===i) error_found=true;
                                }
                                if (!error_found) sc.portfolio.push(results.data[i]);
                        }
                        sc.$apply();
                }
                pp_config.header=true;
        
        
        }else if (kind==="calendar"){
                pp_config.complete=function(results,file){
                        var i;
                        var dates=[];
                        if (!sc.params) sc.params={};
                        if (!sc.params.calendars) sc.params.calendars={};    
                        for (j=1;j<results.data.length;j++){
                                dates.push(results.data[j][0])                               
                                };
                                sc.params.calendars[results.data[0]]={
                                        dates: dates
                        		}
                       sc.params_count=sc.params_count + 1;
                        sc.$apply();                       
                }       
        }else{
                return null;
        }        
        if("string"===typeof(fil)){
                pp_config.download=true;
                Papa.parse(fil,pp_config);
        }else if(fil.name){
	        pp_config.download=false,
                Papa.parse(fil,pp_config)
        }
}

const load_scenarios_from_server=function(sc){
	if (!sc.available_scenarios.selection){
		alert("No scenario group selected");
		return 0;
	}
	var req=new XMLHttpRequest();	
	req.addEventListener('load', function(evt){
		if(req.status===200){
			sc.scenario_group=JSON.parse(req.responseText);       
            sc.$apply();
		}else{
			alert("Could not load scenario group from server");
		}
	});

	
	req.addEventListener('error', function(evt){
		alert("Could not load scenario group from server");
	});
	req.open('GET', '/api/scenarios/' + sc.available_scenarios.selection);
	req.send();
}

const load_scenarios_list=function(sc){
	var req=new XMLHttpRequest();	
	req.addEventListener('load', function(evt){
		if(req.status===200){
			sc.available_scenarios.list=JSON.parse(req.responseText);
			sc.available_scenarios.selection=sc.available_scenarios.list[0];
            sc.$apply();                       
		}else{
			//silent error
			console.log("Could not load list of available scenarios groups from server");
		}
	});	
	req.addEventListener('error', function(evt){
		//silent error
		console.log("Could not load list of available scenario groups from server");
	});
	req.open('GET', '/api/scenarios/');
	req.send();	
}

var import_data_json=function(fil, kind, sc){   
    fil.text().then(text => {
        if (kind==="params"){
            sc.params=JSON.parse(text);	
            var keys=['curves','scalars','surfaces','calendars'];
            for (j=0;j<keys.length;j++){
                if (undefined===sc.params[keys[j]]) continue;
                key=Object.keys(sc.params[keys[j]]);
                sc.params_count=sc.params_count + key.length;
            }	    
        }else if (kind==="portfolio"){
		    if (!sc.portfolio) sc.portfolio=[];
		    var portfolio_in;
		    portfolio_in=JSON.parse(text);
			for (j=0; j<portfolio_in.length;j++){
				sc.portfolio.push(portfolio_in[j]);
			}	                      
        }else if (kind==="scenarios"){
			sc.scenario_group=JSON.parse(text);	 
		}
        sc.$apply();
    });
}



