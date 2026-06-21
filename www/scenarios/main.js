
var app = angular.module('riskapp', []); 

app.controller('main_ctrl', ['$scope', function($scope) { // Controller für index.html

    /* definition of scope und worker (worker.js) */
	
	$scope.available_scenarios={list: null, selection: null};
    $scope.display={
		popup: 'load',
		name: null,
		scenario: null,
		rule: null
	}
	$scope.scenario_group=null;
	
	$scope.generator={
	    prefix: '',
        risk_factors: [],
        risk_factor_name_from_csv: false,
        tags: [],
        model: 'additive',
        input_type: 'scenarios',
        max_scenarios: 0,
        existing: 'replace',
        mirror: false,
	}
        
    $scope.update_scenarios_list=function(){ 
	    load_scenarios_list($scope);  // function in import.js
    }

    $scope.update_scenarios_list();

    $scope.load_scenarios=function(){ 
	    load_scenarios_from_server($scope);    // function in import.js            
    }

    $scope.save_scenarios=function(){ 
	    save_scenarios($scope);    // function in upload.js            
    }

    $scope.new_scenario_group=function(){ 
	    $scope.scenario_group=[];
		$scope.display.scenario=null;
		$scope.display.name="New Scenario Group";
		$scope.display.popup=null;
    }

	$scope.move_scenario_up=function(){
		let i=0;
		while(i<$scope.scenario_group.length){
			if($scope.display.scenario===$scope.scenario_group[i]) break;
			i++;
		}
		if (i==0) return 0;
		$scope.scenario_group[i]=$scope.scenario_group[i-1];
		$scope.scenario_group[i-1]=$scope.display.scenario;
	}

	$scope.move_scenario_down=function(){
		let i=0;
		while(i<$scope.scenario_group.length){
			if($scope.display.scenario===$scope.scenario_group[i]) break;
			i++;
		}
		if (i==$scope.scenario_group.length-1) return 0;
		$scope.scenario_group[i]=$scope.scenario_group[i+1];
		$scope.scenario_group[i+1]=$scope.display.scenario;
	}

	$scope.delete_scenario=function(){
		let i=0;
		while(i<$scope.scenario_group.length){
			if($scope.display.scenario===$scope.scenario_group[i]) break;
			i++;
		}
		$scope.scenario_group.splice(i,1);
		$scope.display.scenario=null;
	}

    $scope.export_scenarios=function(){ 
	    export_to_json_file($scope.scenario_group, "scenarios.json"); // Funktion aus export.js
    }

	$scope.add_scenario=function(){
		let s={
			name: "New Scenario"
		};
		$scope.scenario_group.push(s);
		$scope.display.scenario=s;
	}

	$scope.add_rule=function(){
		if(null===$scope.display.scenario) return 0;
		if(!Array.isArray($scope.display.scenario.rules)) $scope.display.scenario.rules=[];
		$scope.display.scenario.rules.push({});
	}

	$scope.edit_list=function(array){
		let text=array.join(',');
		text = prompt("Edit list", text);
		if (null===text) return 0;
		let new_array=text.split(',');
		let i=0;
		for (i=0;i<new_array.length;i++){
			array[i]=new_array[i].trim();
		}
		array.length=new_array.length;
		array.sort();
		let last='';
		i=0;
		while (i<array.length){
			if(array[i]==='' || array[i]===last){
				array.splice(i,1);
			}else{
				last=array[i];
				i++;
			}
		}
	}

	$scope.edit_risk_factors=function(rule){
		if(!Array.isArray(rule.risk_factors)) rule.risk_factors=[];
		array=rule.risk_factors;
		$scope.edit_list(array);
	}


	$scope.edit_tags=function(rule){
		if(!Array.isArray(rule.tags)) rule.tags=[];
		array=rule.tags;
		$scope.edit_list(array);
	}

	$scope.delete_rule=function(rule){
		let i=0;
		while(i<$scope.display.scenario.rules.length){
			if($scope.display.scenario.rules[i]===rule) break;
			i++;
		}
		$scope.display.scenario.rules.splice(i,1);
	}

	$scope.copy_rule_values=function(rule){
		let text="\t"+rule.labels_x.join("\t")+"\n";
		for (let i=0;i<rule.labels_y.length;i++){
		    text+=rule.labels_y[i]
		    for(let j=0;j<rule.labels_x.length;j++){
			    text+="\t"+rule.values[j][i]
			}
			text+="\n";
		}
		text.length--;
		navigator.clipboard.writeText(text).then(function() {}, function() {
			alert("Failed to copy to clipboard");
		});
	}

	$scope.paste_rule_values=function(rule){
		navigator.clipboard.readText().then(function(text){
			let data=text.replaceAll('\r','').toLowerCase().split("\n");
			if (''===data[data.length-1]) data.pop();
			let x=data[0].split("\t");
			x.shift();
			data.shift();
			let y=[];
			let v=[];
			if(!data.length){
				alert("Could not parse pasted data, contains only one line");
				return 0;
			}
			while (data.length){
				let line=data.shift();
				line=line.split("\t");
				y.push(line.shift());
				if (line.length!==x.length){
					alert("Could not parse pasted data, line lengths do not match");
					return 0;
				}
				v.push(line);
			}
			// transpose values matrix so it complies to jsonrisk standard, i.e., matrix contains x.length elements, each is an array of length y.length
			v=v[0].map((_, col_idx) => v.map(row => row[col_idx]));
			
			// validate labels
			const validate_label=function(label){
			    if (isFinite(Number(label))) return true;			
				try{
					JsonRisk.period_str_to_time(label);
				}catch{
					alert("Could not parse pasted data, invalid label " + label + ". Valid labels end with Y,y,M,m,W,w,D, or d. Numeric strings are also supported.");
					return false;
				}		
				return true;
			}
			
			// validate labels x
			for (const label of x){
			    if( !validate_label(label)) return 0;
	
			}
			// validate labels y
			for (const label of y){
			    if( !validate_label(label)) return 0;
			}

			//validate values and convert to numbers
			let tmp;
			for (let i=0;i<x.length;i++){
				for (let j=0;j<y.length;j++){
					tmp=parseFloat(v[i][j].replace(',','.'));
					if (isNaN(tmp)){
						alert("Could not parse pasted data, invalid number " + v[i][j]);
						return 0;
					}
					v[i][j]=tmp;
				}		
			}
			rule.labels_x=x;
			rule.labels_y=y;
			rule.values=v;
			$scope.$apply();
		},function(){
			alert("Failed to read from clipboard");
		});
	}


    // import functions
	$scope.import_file=function(){
        var f = document.createElement('input');
	    f.setAttribute('type', 'file');
        f.addEventListener('change', function(evt){import_data_json(evt.target.files[0], $scope);}, false);		    
	    f.click();
        return 0; 
    }
    
    const generate_from_csv_callback=function(fil, sc){
        let gen=scenario_generator;
    	fil.text().then(text => {
    	    let max=parseInt(sc.generator.max_scenarios);
    	    if (!isNaN(max)) max=(max>0) ? max : 0;
    	    if(0===max) max=Number.POSITIVE_INFINITY;
    	    
            gen.prefix=sc.generator.prefix;
            gen.risk_factors=sc.generator.risk_factors;
            gen.risk_factor_name_from_csv=false;
            gen.tags=sc.generator.tags;
            gen.model=sc.generator.model;
            gen.input_type=sc.generator.input_type;
            gen.max_scenarios=max;
            gen.mirror=sc.generator.mirror;
            
            let result=gen.scenarios_from_string(text);
            
            if (null===result){
                alert(gen.error);
                return null;
            }
            if('replace'===sc.generator.existing){
                //replace current scenarios
		        sc.scenario_group=result;
		    }else if('merge' === sc.generator.existing){
		        //merge into current scenarios if length is the same
		        let g=sc.scenario_group.length;
		        let r=result.length;
		        if(g!==r){
		            alert(`Cannot merge scenario rules from CSV into existing scenarios. Number of existing scenarios is ${g} and CSV contained ${r} rules.`);
		            return null;
		        }
		        while(g>0){
		            g--;
		            sc.scenario_group[g].rules.push(result[g].rules[0]);
		        }
		    }else{
		        //append onto current scenarios
		        sc.scenario_group=sc.scenario_group.concat(result);
		    }
		    sc.display.popup=null;
		    sc.$apply();
	    });
    }
    
    $scope.generate_from_csv=function(){
        var f = document.createElement('input');
	    f.setAttribute('type', 'file');
        f.addEventListener('change', function(evt){generate_from_csv_callback(evt.target.files[0], $scope);}, false);		    
	    f.click();
        return 0;
    }           
    
}]);

