class jr_aggregator {
	results=[];
	#index={};
	constructor(grouping){
		this.grouping=grouping;
		this.#index={};
	}

	#group(item){
		let grouping_str='';
		let tmp;
		const delimiter=String.fromCharCode(124);
		for(let i=0;i<this.grouping.length;i++){
			tmp=item[this.grouping[i]] || '';
			if('number' === typeof tmp) grouping_str+=tmp.toExpoential();
			if('string' === typeof tmp) grouping_str+=tmp;
			if(i<this.grouping.length-1) grouping_str+=delimiter;
		}
		item._grouping=grouping_str;
	}

	#add_arrays(target,source){
		let i=0;
		while (i<target.length && i<source.length){
			if (typeof source[i] !== 'number' ) source[i]=0;
			if (typeof target[i] !== 'number' ) target[i]=0;
			target[i]+=source[i];
			i++;
		}
	}

	#add_objects(target,source){
		for (const [key,value] of Object.entries(source)){
			if(undefined === target[key]) target[key]=0;
			target[key] += (typeof value !== 'number') ? 0 : value;
		}
	}

	#add(target,item){
		for (const [key,value] of Object.entries(item)){
			let target_value=target[key]; // undefined if property does not exist	
			if ('number' === typeof(value)){
				// numbers: add them
				if('number' === typeof(value)){
					target[key]+=value;
				}else{
					target[key]=value;
				}
				continue;
			}
			if ('string' === typeof(value)){
				// strings: if not equal, set empty
				if(target_value!==value) target[key]='';
				continue;
			}
			if (Array.isArray(value)){
				// arrays: add element-wise
				if (!Array.isArray(target_value)) target[key]=new Array(value.length);
				this.#add_arrays(target[key],value);
				continue;
			}
			if (value && 'object' === typeof(value)){
				// non-null objects: merge and add entries
				if ('object' !== typeof(target_value)) target[key]={};
				this.#add_objects(target[key],value);
				continue;
			}
		}
		// strings: if item does not have the property, set empty string on target
		for (const [key,value] of Object.entries(target)){
			if ('string' === typeof(value)){
				if(undefined===item[key]){
					target[key]='';
				}
			}
		}
	}

	append(items){
		for(let i=0;i<items.length;i++){
			let item=items[i];
			this.#group(item);
			if (this.#index[item._grouping]){
				//key exists already, must aggregate new item onto existing item
				let target=this.#index[item._grouping];
				this.#add(target,item);
			}else{
				// new grouping key, append to results
				item=JSON.parse(JSON.stringify(item));
				this.results.push(item); // append item to the result array
				this.#index[item._grouping]=item; // add entry to index
			}	
		}
	}
}

if('object' === typeof exports && 'object' === typeof module) module.exports = jr_aggregator;


