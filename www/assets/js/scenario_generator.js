/*

Brief support library for generating scenarios from historic CSV data

*/

(function(root){
    
    const scenario_generator=function(){
        this.prefix='';
        this.risk_factors=[];
        this.tags=[];
        this.model='additive'; // additive, multiplicative or absolute
        this.input_type='scenarios'; // scenarios or history
        this.error='';
        this.max_scenarios=Number.POSITIVE_INFINITY;
        this.mirror=false;
        return this;
    }
    
    const additive=function(vec1,vec2,mirror){
        let ret=new Array(vec1.length);
        for (let i=0;i<ret.length;i++){
            if(!mirror) ret[i]=vec2[i]-vec1[i];
            if(mirror) ret[i]=vec1[i]-vec2[i];
            ret[i]=Math.round(ret[i]*1E14)/1E14;
        }
        return ret;
    }
    
    
    const multiplicative=function(vec1,vec2,mirror){
        let ret=new Array(vec1.length);
        for (let i=0;i<ret.length;i++){
            if(!mirror) ret[i]=Math.round(vec2[i]/vec1[i]*1E14)/1E14;
            if(mirror) ret[i]=Math.round(vec1[i]/vec2[i]*1E14)/1E14;
        }
        return ret;
    }
    
    const absolute=function(vec1,vec2,mirror){
        return vec1;
    }
    
    scenario_generator.prototype.scenarios_from_string=function(str){
        let data=str.replaceAll('\r','').replaceAll("\t",';').split('\n');
        // remove trailing empty lines
        while (data[data.length-1]==='') data.pop();
        // tags are in the first line
        let labels=data.shift();
        // lines are semicolon separated
        labels=labels.split(';');
        //first column in first line typically contains a risk factor name, use this only if neither risk factors nor tags are set
        let rf=labels.shift();
        if (0===this.tags.length && 0===this.risk_factors.length) this.risk_factors=[rf];
        // scalar scenarios get a 1Y tag
        if(1===labels.length) labels[0]='1Y';
        const n_labels=labels.length;
        let n_scenarios=data.length; // number of scenarios is typically the number of lines, without header
        if (this.input_type==='history' && this.model!=='absolute') n_scenarios--; // if historic scenarios are generated as differences or returns, we need an extra line of data
        n_scenarios=Math.min(n_scenarios,this.max_scenarios); // never generate more than max_scenarios
        if (n_scenarios<1){
            this.error='Number of scenarios is smaller than one.'
            return null;
        }
        // transform data
        let temp;
        for (let i=0;i<data.length;i++){
            data[i]=data[i].split(';');
            temp={
                name_or_date: data[i].shift(),
                time_values: data[i]
            }
            if (temp.time_values.length!==n_labels){
                this.error=`Row ${i+2} contains ${temp.time_values.length} columns, but should contain ${n_labels} columns.`
                return null;
            }
            for (let j=0;j<n_labels;j++){
                temp.time_values[j]=parseFloat(temp.time_values[j]);
                if(isNaN(temp.time_values[j])){
                    this.error=`Row ${i+2}, Column ${j+2} contains an invalid value.`;
                    return null;
                }
            }
            data[i]=temp;
        }
        // make scenarios
        let func=null;
        if (this.model==='additive') func=additive;
        if (this.model==='multiplicative') func=multiplicative;
        if (this.model==='absolute') func=absolute;
        if (this.input_type==='scenarios') func=absolute;
        if(null===func){
            this.error=`Model is ${this.model}, but should be either additive, multiplicative, or absolute`;
            return null;
        }
        
        const scenarios=new Array(n_scenarios);
        let name, vec1, vec2, values, i_data=data.length-1, i_scenario=n_scenarios-1;
        if (this.input_type==='history' && this.model!=='absolute') i_data--; // skip last data entry for historic differences or returns
        while (i_data>=0 && i_scenario>=0){
            name=this.prefix; // scenario name always starts with prefix, may be empty
            name+=data[i_data].name_or_date; // always add scenario name or date from CSV
            if (this.input_type==='history' && this.model!=='absolute') name+='_'+data[i_data+1].name_or_date; // also add next date for historic differences or returns
            vec1=data[i_data].time_values;
            if (this.input_type==='history' && this.model!=='absolute') vec2=data[i_data+1].time_values; // include next date for historic differences or returns
            values=func(vec1,vec2, this.mirror);
            
            scenarios[i_scenario]={
                name: name,
                rules: [{
                    tags: JSON.parse(JSON.stringify(this.tags)),
                    risk_factors: JSON.parse(JSON.stringify(this.risk_factors)),
                    model: this.model,
                    labels_x: labels,
                    labels_y: ["1Y"], // support only one dimensional scenarios for now
                    values: values.map((v)=>[v]) // scenario values are 2d arrays
                }]        
            }
            i_data--;
            i_scenario--;
        }
        return scenarios;
    }
      
    if (typeof module === 'object' && typeof exports !== 'undefined'){
        // nodejs
        module.exports=new scenario_generator();
        exports=module.exports;
    }else{
        // browser
        root.scenario_generator=new scenario_generator();
    }
})(this);
