var app = angular.module('riskapp', []); 

app.filter('filter_scalars', function(){ return filter_scalars;});

app.controller('main_ctrl', ['$scope', '$http', function($scope, $http) { // Controller für index.html

	$scope.dates={
		available: null,
		selection: null
	};

	$scope.result_sets={
		available: null,
		selection: null
	};

	$scope.fields=[];
	$scope.meta={};

	$scope.spec={
		fields: [],
		grouping: ['sub_portfolio'],
		"per-scenario fields": [],
		scenarios: ['Base'],
		filter: null
	};

	$scope.picker={
		enabled: false,
		filter: "",
		left: "",
		right: ""
	};
	$scope.filter_editor={
		enabled: false,
		json: ""
	};

	$scope.export_settings={
		separator: '\t'
	}

	$scope.display={
		loading: false
	}

	$scope.results=null;
	$scope.local_results=null;
	$scope.report=null;

	$scope.load_dates=function(){
		$http({
			method: 'GET',
			url: '/api/results'
		}).then(function success_callback(response) {
			if (Array.isArray(response.data.res)){
				$scope.dates.available=response.data.res;
			}
		  }, function error_callback(response) {
			alert("Request failed");
		});
	};

	$scope.load_dates();

	
	$scope.load_result_sets=function(){
		if (!$scope.dates.selection) return 0;
		$http({
			method: 'GET',
			url: '/api/results/' + $scope.dates.selection
		}).then(function success_callback(response) {
			if (Array.isArray(response.data.res)){
				$scope.result_sets.available=response.data.res;
			}
		  }, function error_callback(response) {
			alert("Request failed");
		});
	};

	$scope.load_results=function(){
		if(!$scope.result_sets.selection) return 0;
		$scope.display.loading=true;
		$scope.report=null;
		$scope.results=null;
		let date=$scope.result_sets.selection.date;
		let name=$scope.result_sets.selection.name;
		$http({
			method: 'POST',
			data: $scope.spec,
			url: '/api/results/' + date + '/' + name
		}).then(function success_callback(response) {
			if ('object' === typeof response.data.res){
				$scope.update_results(response.data.res);
				$scope.display.loading=false;
			}
		  }, function error_callback(response) {
			$scope.display.loading=false;
			alert("Request failed");
		});
	};

	$scope.load_local=function(data){
		if (data) $scope.local_results=data;
		if (!$scope.local_results) return null;
		let aggr=new jr_aggregator($scope.spec.grouping);
		aggr.append($scope.local_results.results);

        let res={
			results: aggr.results,
			meta: $scope.local_results.meta
        }
		$scope.update_results(res);
	}

	$scope.update_results=function(response){
        if (!Array.isArray(response.results)) alert("An internal error occurred, server response does not include results");
		$scope.results=response.results.sort(function(a, b) {
			return a._grouping.localeCompare(b._grouping);
		});
		update_fields($scope);
		$scope.meta.scenarios=update_scenarios(response);
		$scope.report=jr_render_report($scope.results,$scope.meta,$scope.spec)
	}

	$scope.sel_to_right=function(){
		let active=$scope.picker.left;
		while (active.length>0){
			var item=active.shift();
			$scope.picker.selection.push(item);
		}
	}

	$scope.sel_to_left=function(){
		let active=$scope.picker.right;
		while (active.length>0){
			var item=active.shift();
			var idx=$scope.picker.selection.indexOf(item);
			$scope.picker.selection.splice(idx,1);
		}
	}

	$scope.all_to_right=function(){
		$scope.picker.selection=JSON.parse(JSON.stringify($scope.picker.available));
	}

	$scope.all_to_left=function(){
		$scope.picker.selection=[];
	}

	$scope.move_up=function(){
		let active=$scope.picker.right;
		if (active.length===0) return;
		let item=active[0];
		let idx=$scope.picker.selection.indexOf(item);
		if (0===idx) return;
		$scope.picker.selection[idx]=$scope.picker.selection[idx-1];
		$scope.picker.selection[idx-1]=item;
	}


	$scope.move_down=function(){
		let active=$scope.picker.right;
		if (active.length===0) return;
		let item=active[0];
		let idx=$scope.picker.selection.indexOf(item);
		if ($scope.picker.selection.length-1===idx) return;
		$scope.picker.selection[idx]=$scope.picker.selection[idx+1];
		$scope.picker.selection[idx+1]=item;
	}

	$scope.edit=function(target, available){
		let temp=JSON.parse(JSON.stringify($scope.spec[target]));
		$scope.picker={
			available: available,
			selection: temp || [],
			enabled: true,
			title: "Edit " + target,
			target: target,
			filter: "",
			left: "",
			right: ""
		};
	}	

	$scope.cancel_edit=function(){
		$scope.picker.enabled=false;
	};

	$scope.edit_filter=function(){
		$scope.filter_editor.json=JSON.stringify($scope.spec.filter || {}, null, 2);
		$scope.filter_editor.enabled=true;
	};

	$scope.cancel_edit_filter=function(){
		$scope.filter_editor.enabled=false;
	};

	$scope.confirm_edit_filter=function(){
		try {
			$scope.spec.filter=JSON.parse($scope.filter_editor.json);
		} catch (e) {
			alert("Invalid JSON: " + e.message);
			return;
		}
		$scope.filter_editor.enabled=false;
		$scope.load_results();
	};

	$scope.confirm_edit=function(){
		target=$scope.picker.target;
		$scope.spec[target]=$scope.picker.selection;
		$scope.picker.enabled=false;
		if("grouping"===target){
			if ($scope.local_results){
				$scope.load_local();
			}else{
				$scope.load_results();
			}
		}else{
			$scope.report=jr_render_report($scope.results,$scope.meta,$scope.spec)
		}
	}

	$scope.export=function(){
		var a = document.createElement('a');
		var result=render_csv($scope.report, $scope.export_settings.separator);
		a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(result);
		a.download='report.csv';

		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		return null;
	}

	$scope.clipboard=function(){
		var result=render_csv($scope.report, $scope.export_settings.separator);
		navigator.clipboard.writeText(result).then(function() {}, function() {
			alert("Failed to copy to clipboard");
		});
		return null;
	}

}]);
