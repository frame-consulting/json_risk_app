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


const load_params_from_server=function(sc){
	if (!sc.available_params.selection){
		alert("No parameter set selected");
		return 0;
	}
	var req=new XMLHttpRequest();	
	req.addEventListener('load', function(evt){
		if(req.status===200){
            sc.params_count=0;
			sc.params=JSON.parse(req.responseText);
			let name=sc.available_params.selection.substring(11);
			name=name.substring(0,name.length-5);
			sc.params.name=name;
			sc.display.popup=null;
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

const load_params_list=function(sc){
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

const import_data_csv=function(fil, kind, sc){
        var pp_config={
	        header: false,
        	dynamicTyping: true,
	        worker: false,
	        delimiter: "",
	        skipEmptyLines: true
        };
    
        const tags=['csv'];
    
        if (kind==="params"){
        }else if (kind==="scalar"){
                pp_config.complete=function(results,file){
                        var i,j;
                        var column;
                        if (!sc.params) sc.params={};
                        if (!sc.params.scalars) sc.params.scalars={};    
                        for (j=0;j<results.data[0].length;j++){
                                // name
                                const name=results.data[0][j];
                                if(typeof name !== "string") continue;
                                if (name.length===0) continue;
                                // insert scalar
                                const value=results.data[1][j];
                                sc.params.scalars[name]={
                                        type: "equity / fx",
                                        value,
                                        tags
                                };
                        }
                        sc.$apply();
                }        
        }else if (kind==="curve"){
                pp_config.complete=function(results,file){
                        // name
                        const name=results.data[0][0];
                        
                        // labels
                        const labels=[];
                        for (j=1;j<results.data[0].length;j++){  // first row
                            labels.push(results.data[0][j]);
                        }
                        
                        // zero rates
                        const zcs=[];
                        for (j=1;j<results.data[1].length;j++){
                            zcs.push(results.data[1][j]);
                        }
                        
                        // insert curve
                        if (!sc.params) sc.params={};
                        if (!sc.params.curves) sc.params.curves={};
                        sc.params.curves[results.data[0][0]]={
                                type: "yield / spread",
                                labels,
                                zcs,
                                tags
                        }
                        sc.$apply();
                }
        
        }else if (kind==="surface"){
                pp_config.complete=function(results,file){
                        // name
                        const name=results.data[0][0];
                        // expiries
                        const labels_expiry=[];
                        for (let i=1;i<results.data[0].length;i++){
                                labels_expiry.push(results.data[0][i]);
                        }

                        // terms
                        const labels_term=[];
                        for (let j=1; j<results.data.length;j++){  
                                    if (results.data[j].length!==results.data[0].length) continue; 
                                    labels_term.push(results.data[j][0]);
                        }
                        
                        // values
                        const values=labels_expiry.map(()=>new Array(labels_term.length));
                        
                        let idx_exp=0;
                        for (let i=1;i<results.data[0].length;i++){
                            let idx_term=0;
                            for (let j=1; j<results.data.length;j++){  
                                if (results.data[j].length!==results.data[0].length) continue; 
                                values[idx_exp][idx_term]=results.data[j][i];
                                idx_term++;
                            }
                            idx_exp++;
                        }

                        // insert surface
                        if (!sc.params) sc.params={};
                        if (!sc.params.surfaces) sc.params.surfaces={};
                        sc.params.surfaces[results.data[0][0]]={
                                type: "bachelier",
                                labels_expiry,
                                labels_term,
                                values,
                                tags
                        }
                        sc.$apply();
                }
        }else if (kind==="portfolio"){
                pp_config.complete=function(results,file){
                        if (!sc.portfolio) sc.portfolio=[];
                        for (let i=0; i<results.data.length; i++){
                                let error_found=false;
                                for (let j=0; j<results.errors.length; j++){
                                        if (results.errors[j].row===i) error_found=true;
                                }
                                if (!error_found) sc.portfolio.push(results.data[i]);
                        }
                        sc.$apply();
                }
                pp_config.header=true;
        }else if (kind==="calendar"){
                pp_config.complete=function(results,file){
                        const name=results.data[0];
                        const dates=[];
                        if (!sc.params) sc.params={};
                        if (!sc.params.calendars) sc.params.calendars={};    
                        for (let j=1;j<results.data.length;j++){
                                dates.push(results.data[j][0])                               
                        };
                        sc.params.calendars[name]={dates};
   
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



const import_data_json=function(fil, sc){   
	fil.text().then(text => {		
		sc.params=JSON.parse(text);	
		var keys=['curves','scalars','surfaces','calendars'];
		for (j=0;j<keys.length;j++){
			if (undefined===sc.params[keys[j]]) continue;
			key=Object.keys(sc.params[keys[j]]);
			sc.params_count=sc.params_count + key.length;
		}	    
		sc.$apply();
	});
}



