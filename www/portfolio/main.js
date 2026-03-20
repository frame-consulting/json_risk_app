var app = angular.module('riskapp', []); 

app.filter('filter_scalars', function(){ return filter_scalars;});

app.controller('main_ctrl', ['$scope', '$http', function($scope, $http) { // Controller für index.html


    /* definition of scope und worker (worker.js) */
	$scope.portfolios=[];
    $scope.display={
		tab: 'portfolios',
		show_portfolios: true,
		filter: '',
		columns: []
	};
	$scope.editor={json: null,index: -1};
	$scope.upload={name: "", date: "",msg: ""};

	// variables for the single portfolio view
	// the single portfolio which is selected, as array of instruments
	$scope.portfolio={
		name: '',
		date: '',
		instruments: [],
		filter: ''
	};

	$scope.update=function(){
		$http({
			method: 'GET',
			url: '/api/portfolio/all'
		}).then(function success_callback(response) {
			if (Array.isArray(response.data.res)){
				$scope.portfolios=response.data.res;
			}
		  }, function error_callback(response) {
			alert("Request failed");
		});
	}

	$scope.update();

	$scope.download=function(item){
		window.open(`/api/portfolio/${item.date}/${item.name}`, '_blank');
		var a = document.createElement('a');
		a.href = `/api/portfolio/${item.date}/${item.name}`;
		a.download=`${item.name}.json`;

		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		return null;
	}

	$scope.update_columns=function(){
		const columns = collect_instrument_keys($scope.portfolio.instruments); // function in util.js
		$scope.portfolio.columns=columns;
	}

	/**
	 * view a single portfolio, indentified by name and date, and output the array of its instruments 
	 */
	$scope.view_portfolio=function(item){
		$http({
			method: 'GET',
			url: `/api/portfolio/${item.date}/${item.name}`
		}).then(function success_callback(response) {			
			$scope.portfolio.name=item.name;
			$scope.portfolio.date=item.date;
			if (response.headers('Content-Type').startsWith('text/csv')){
				$scope.portfolio.instruments=parse_response(response.data);
			}else{
				// no need to parse JSON response
				$scope.portfolio.instruments=response.data;
			}
			$scope.update_columns();
			$scope.display.show_portfolios=false;
			}, function error_callback(response) {
			alert("Request failed");
		});		
	}

	$scope.analyse = function(item){
		var a = document.createElement('a');
		a.href = '/analysis?'+encodeURIComponent(JSON.stringify(item,repl,0));
		a.setAttribute('target', '_blank');

		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		return null;
	}

	parse_response=function(data){
		let pp_config={
			header: true,
			dynamicTyping: true,
			worker: false,
			delimiter: "",
			skipEmptyLines: true
		};

		let tmp=Papa.parse(data,pp_config);

		let res=[],i,j, error_found;
        for (i=0; i<tmp.data.length; i++){
			error_found=false;
			for (j=0; j<tmp.errors.length; j++){
					if (tmp.errors[j].row===i) error_found=true;
			}
			if (!error_found) res.push(tmp.data[i]);
        }			
		return res;
	} 

	$scope.close_portfolio_view=function(){
		$scope.cancel_editor();
		$scope.display.show_portfolios=true;
		$scope.upload.msg='';
	}

	/**
	 * view the single instrument of a portfolio
	 */
	$scope.view_instrument=function(item){
		$scope.editor.index=-1;
		$scope.editor.json=JSON.stringify(item, repl, 1);
		window.scrollTo(0, 0); 
	}

    $scope.create_instrument = function() {
        $scope.view_instrument({
            id: 'new_item',
            type: 'bond',
            sub_portfolio: 'bonds',
            notional: 10000,
            currency: 'EUR',
            maturity: '2030-01-01',
            tenor: 1,
            fixed_rate: 0.01,
        });
    }

	/**
	 * edit the single instrument of a portfolio 
	 */
	$scope.edit_instrument=function(item){  
		$scope.editor.index=$scope.portfolio.instruments.indexOf(item);
		$scope.editor.json=JSON.stringify(item, repl, 1);
		window.scrollTo(0, 0); 
	}

	$scope.add_as_new=function(){
		if ($scope.editor.json){
			if($scope.portfolio.instruments===null) $scope.portfolio.instruments=[];
			var item=JSON.parse($scope.editor.json)
			var i=0,id=item.id||'';
			while(!is_unique_id($scope.portfolio.instruments, id)){
				id=item.id+'_'+i;
				i++;
			}
			item.id=id;
			$scope.portfolio.instruments.unshift(item);
			$scope.update_columns();
		};
	}

	$scope.success=function(response){
		$scope.upload.msg=response.data.res;
	};

	$scope.failure=function(response){
		try{
			$scope.upload.msg=response.data.res || "Something went wrong.";
		}catch{
			$scope.upload.res="Something went wrong.";
		}
	};

	$scope.save_instrument=function(){
		if ($scope.editor.json && $scope.editor.index>=0){
			$scope.portfolio.instruments[$scope.editor.index]=JSON.parse($scope.editor.json);
			$scope.update_columns();
		};
	}

	$scope.remove_instrument=function(item) {
        var i = $scope.portfolio.instruments.indexOf(item);
        $scope.portfolio.instruments.splice(i, 1);
		$scope.update_columns();
    }

	$scope.save_portfolio=function(){
		const url=`/api/portfolio/${$scope.portfolio.date}/${$scope.portfolio.name}`;
		let tmp=$scope.portfolio.instruments;
		tmp=JSON.stringify(tmp, repl, 1);
		tmp=pako.gzip(tmp);

		$http({
			method: 'POST',
			url: url,
			headers: {
				'Content-Type': 'application/json',
				'Content-Encoding': 'gzip'
			},
			data: tmp,
			transformRequest: []
		}).then($scope.success)
		.catch($scope.failure);
	}

	$scope.cancel_editor=function(){
			$scope.editor={json: null,index: -1}
	}

	$scope.send_data=function(){
		// check valid date
		if (!$scope.upload.date){
			$scope.upload.msg='Invalid date, must be in yyyy-mm-dd format.';
			return null;
		}
		// check valid name
		if (!$scope.upload.name){
			$scope.upload.msg='Invalid name, must consist of letters, numbers, hyphens and underscores.';
			return null;
		}
		const url='/api/portfolio/' + $scope.upload.date + '/' + $scope.upload.name;

		// get file and check it contains data
        let tmp=document.getElementById('form_data');
        tmp = new FormData(tmp);
		tmp=tmp.get('file');
		if(!tmp.size){
			$scope.upload.msg='Must select a valid JSON file.';
			return null;
		}

		$scope.upload.msg='Uploading JSON file...';

		tmp=tmp.text().then(function(tmp){
			// check valid JSON Array
			try{
				if(!Array.isArray(JSON.parse(tmp))){
					$scope.upload.msg='File contains invalid data. Must be an array of instruments.';
					$scope.$apply();
					return null;
				}
			}catch{
				$scope.upload.msg='File is not in JSON format.';
				$scope.$apply();
				return null;
			}
			tmp=pako.gzip(tmp);
		    $http({
				method: 'POST',
				url: url,
				headers: {
					'Content-Type': 'application/json',
					'Content-Encoding': 'gzip'
				},
				data: tmp,
				transformRequest: []
		    }).then($scope.success)
			.catch($scope.failure);
		});
	}

    $scope.import_file = function(type, url) {
		var f = document.createElement('input');
		f.setAttribute('type', 'file');
		f.addEventListener('change', function(evt) {
			if (type === 'csv') {
				import_data_csv(evt.target.files[0], $scope);
			} else if (type === 'json') {
				import_data_json(evt.target.files[0], $scope);
			}
		}, false);
		f.click();
		return 0;
    }

 	$scope.export_portfolio = function(format) {
        if (format === 'json') {
            export_to_json_file($scope.portfolio.instruments, $scope.portfolio.name + ".json"); // function in export.js
        } else if (format === 'csv') {
			const columns = collect_instrument_keys($scope.portfolio.instruments); // function in util.js
            export_to_csv_file($scope.portfolio.instruments, $scope.portfolio.name + ".csv", columns); // function in export.js
        }
    }

    $scope.delete_portfolio = function() {
		$scope.portfolio.instruments=[];
    };

    $scope.create_portfolio = function() {
		$scope.portfolio={
			name: 'New',
			date: '2022-01-01',
			instruments: []
		};
		$scope.display.show_portfolios=false;
		$scope.display.tab='portfolios';
    };

	$scope.$watch('editor.json', function(){
		$scope.editor.valid=false;
		$scope.editor.msg="";
		try{
			JsonRisk.valuation_date="2000-01-01";
			console.debug('watching editor.json', $scope.editor.json);
			JsonRisk.make_instrument(JSON.parse($scope.editor.json)); //test if JSON is valid at all and if instrument is valid

		}catch(e){
			$scope.editor.msg=e.message;
			return 0;
		}
		$scope.editor.valid=true;
	}, true);

	/**
	 * TODO maybe the following functions should be saved in another file, and used also in pricing
	 */
	function is_unique_id(instruments, str){ 
		for(j=0; j<instruments.length;j++){
			if(instruments[j].id===str) return false;
		}
		return true;
	};

	function repl(key,value){  
		if (key==='$$hashKey') return undefined; // exclude angularJS internal variable
		return value;
	}


	

}]);

