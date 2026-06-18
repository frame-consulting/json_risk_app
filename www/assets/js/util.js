const number_format = new Intl.NumberFormat("en-US", {
  style: "decimal",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  roundingMode: 'halfExpand'
});

const filter_scalars=function(value){
	if (null===value) return '';
	if (undefined===value) return '';
	switch(typeof value){
		case 'number':
			if (Math.abs(value)<0.5) return value.toFixed(6);
			return number_format.format(value);
		case 'string':
			return value;
		case 'boolean':
			return value ? "True" : "False";
		case 'object':
			return "Object/Array";
	}
	return "Error";
}

const collect_instrument_keys = function(instruments) {
    // collect keys from all instruments
    let temp = {};
    for(const i of instruments){
        Object.assign(temp, i);
    }
    // remove hash key property
    delete temp['$$hashKey'];
    
    // remove front properties
    const first_columns = ["id","type","sub_portfolio"];
    first_columns.forEach((item) => {delete temp[item];});

    // convert into array and sort
    temp = Object.keys(temp);
    temp = temp.sort(function(a,b){ return a.localeCompare(b) });

    // add front properties
    return [...first_columns, ...temp];
}
