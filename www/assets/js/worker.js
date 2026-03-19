importScripts('/assets/js/json_risk.js'); // makes JsonRisk available in global scope
importScripts('/assets/js/module_support.js'); // makes module_support available in global scope

/* I. main logic called by main.js */

let params=null;
let modules=[];

onmessage = function(e) {
	const d=e.data;
	if (d.params){
		params=d.params;	
	}
	if (d.modules){
        if (!Array.isArray(d.modules)){
			postMessage({error: true, msg: 'Invalid modules configuration', id: null});
			return 0;
        }
        modules=module_support.load_modules_and_dependencies(d.modules);
	}
	if (d.instrument){
		if(!params){
			postMessage({error: true, msg: 'No parameters loaded', id: null});
			return 0;
		}

        // ensure id is a string
        d.instrument.id="" + (d.instrument.id || "undefined");

		// call instrument_mapping instructions from all modules
		try{
			for (const m of modules){
			    // check if instrument_mapping exists
			    if (typeof m.instrument_mapping !== "function") continue;
		     
		        try{
				    m.instrument_mapping.call({
				        instrument_json: d.instrument,
				        params_json: params
			        });
                }catch(ex){
                    let message=`Error in module ${m.name}: ${ex.message}`;
                    throw new Error(message);
                }
		    }
		}catch(ex){
			postMessage({warning: true, msg: ex.message, id: d.instrument.id})
		}

		try{
			// run generic JSON risk simulation
			const res=JsonRisk.simulation(d.instrument,params,modules);
            res.id=d.instrument.id;
			postMessage({res: res});
		}catch(ex){
			postMessage({error: true, msg: ex.message, id: d.instrument.id});
		}
	}
}
