const load_params_from_server=function(sc){
	if (!sc.params.selection){
		sc.params.loaded=null;
		return 0;
	}
	var req=new XMLHttpRequest();	
	req.addEventListener('load', function(evt){
		if(req.status===200){
			sc.params.loaded=JSON.parse(req.responseText);
			send_params_to_worker(sc);
			sc.calculate();    
            sc.$apply();
		}else{
			alert("Could not load params from server");
		}
	});

	
	req.addEventListener('error', function(evt){
		alert("Could not load params from server");
	});
	req.open('GET', '/api/params/' + sc.params.selection);
	req.send();
}

const load_params_list=function(sc){
	var req=new XMLHttpRequest();	
	req.addEventListener('load', function(evt){
		if(req.status===200){
			sc.params.available=JSON.parse(req.responseText);
			if(sc.params.available.length){
			    sc.params.selection=sc.params.available[0];
		    }
            load_params_from_server(sc);                       
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

var load_modules_list=function(sc){
	var req=new XMLHttpRequest();	
	req.addEventListener('load', function(evt){
		if(req.status===200){
			sc.modules.available=JSON.parse(req.responseText).res;
			sc.modules.selection=[];			
			// set default modules for convenience
			for (let m of sc.modules.always){
				if (sc.modules.available.indexOf(m)>=0) sc.modules.selection.push(m);
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

const load_scenarios_from_server=function(sc){
	if (!sc.scenarios.selection){
		sc.scenarios.loaded=[];
		send_params_to_worker(sc);
		sc.calculate();
		return 0;
	}
	var req=new XMLHttpRequest();	
	req.addEventListener('load', function(evt){
		if(req.status===200){
			sc.scenarios.loaded=JSON.parse(req.responseText);
			send_params_to_worker(sc);
			sc.calculate();
            sc.$apply();
		}else{
			alert("Could not load scenario group from server");
		}
	});

	
	req.addEventListener('error', function(evt){
		alert("Could not load scenario group from server");
	});
	req.open('GET', '/api/scenarios/' + sc.scenarios.selection);
	req.send();
}

const load_scenarios_list=function(sc){
	var req=new XMLHttpRequest();	
	req.addEventListener('load', function(evt){
		if(req.status===200){
			sc.scenarios.available=JSON.parse(req.responseText);
			//sc.scenarios.selection=sc.scenarios.available[0];
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


const send_params_to_worker = function(sc){
    const params = Object.assign({}, sc.params.loaded, {
        scenario_groups: sc.scenarios.loaded.length ? [sc.scenarios.loaded] : []
    });

	sc.worker.postMessage({
	    params: params
	});
}
