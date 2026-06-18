const update_fields=function(sc){
	let temp={};
	for (let i=0;i<sc.results.length;i++){
		Object.assign(temp,sc.results[i])
	}
	delete temp._grouping;
	sc.fields=Object.keys(temp);
	sc.fields.sort(function(a,b){ return a.localeCompare(b);});
}

const update_scenarios=function(response){
    if(!Array.isArray(response.meta.scenario_groups)) alert("An internal error occurred: server response does not include scenario info");
    let scenarios=['Base'];
    for (let g of response.meta.scenario_groups){
        if(!Array.isArray(g)) alert("An internal error occurred: server response includes invalid scenario info");
        for ( let s of g){
            scenarios.push(s.name);
        }
    }
    return scenarios;
}
