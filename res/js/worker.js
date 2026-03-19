//declare JsonRisk in the safe global worker scope, like in the web worker
global.JsonRisk=require('../../www/assets/js/json_risk.js');
const module_support=require('../../www/assets/js/module_support.js');
const {parentPort} = require('worker_threads');

let params_json=null;
let modules=[];

parentPort.on('message', function(d) {
	if (d.params){
		try{
			params_json=d.params;
            modules=(d.params.modules || []).map((m) => {
                return module_support.from_base64url(m.source, m.name);
            });
		}catch(ex){
			parentPort.postMessage({error: true, status: 400, msg: ex.message});
		}		
		return 0;
	}
	if (d.instruments){
		if(!params_json){
			parentPort.postMessage({error: true, status: 500, msg: 'No parameters loaded'});
			return 0;
		}
		if(!Array.isArray(d.instruments) && !d.instruments.length){
			parentPort.postMessage({error: true, status: 400, msg: 'Invalid request, instruments must be an array'});
			return 0;
		}
		const res=[];
        let time=Date.now();
		while (d.instruments.length>0){
			const instrument_json=d.instruments.pop();

            // ensure id is a string
            instrument_json.id="" + (instrument_json.id || "undefined");

			try{
                // instrument mapping
                for (const m of modules){
                    // check if instrument_mapping exists
                    if (typeof m.instrument_mapping !== "function") continue;
                    try{
                        m.instrument_mapping.call({
                            instrument_json, params_json
                        });
                    }catch(ex){
                        let message=`Error in module ${m.name}: ${ex.message}`;
                        throw new Error(message);
                    }
                }

				// run generic JSON risk simulation
				const item=JsonRisk.simulation(instrument_json,params_json,modules);
				item.id=instrument_json.id;
				res.push(item);
			}catch(ex){
				res.push({id: instrument_json.id, error: true, msg: ex.message});
			}
		}
        time=Date.now()-time;
        if(time<0) time=0;
		parentPort.postMessage({error: false, status: 200, res: res, time: time});
		return 0;
	}
	parentPort.postMessage({error: true, status: 400, msg: "Invalid message sent to worker. Must contain params or instruments."});
	return 0;
});

