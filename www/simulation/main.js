var app = angular.module('riskapp', []);


app.controller('main_ctrl', ['$scope', function($scope) { // Controller für index.html


    /* definition of scope und worker (worker.js) */
    $scope.portfolio = null;
    $scope.available_params = {
        list: null,
        selection: null
    };
    $scope.available_scenarios = {
        list: null,
        selection: null
    };
    $scope.available_portfolios = {
        list: null,
        selection: null
    };
    $scope.available_portfolio_dates = {
        list: null,
        selection: null
    };
  //  $scope.available_subportfolios = {
    //    list: null,
      //  selection: null
    //};
    $scope.available_modules = {
        list: null,
        selection: null,
		filter: "",
		select_left: "",
		select_right: ""
    };
    $scope.display = {
        tab: 'portfolio',
        scenario: null
    }
    $scope.res = null;
    $scope.errors = null;
    $scope.warnings = null;
    $scope.filter = {
        text: ""
    };
    $scope.editor = {
        json: null,
        index: -1
    };
    wrk = [];
    $scope.analytics = {
        error_count: 0,
        warning_count: 0,
        errors_ids: null
    };
    $scope.scenarios_type = null;
    $scope.upload_error = null;

    /* I. functions called by index.html orderd by tabs (portfolio, parameters, results) and corresponding functions */

    /*  I.i. tab Portfolio  */

    $scope.delete_pf = function() {
        $scope.portfolio = null;
        $scope.res = null;
        $scope.errors = null;
        $scope.warnings = null;
    };
    $scope.update_portfolio_dates_list = function() {
        load_portfolio_dates_list($scope); // function in import.js
    }
    $scope.update_portfolio_dates_list();

    $scope.load_portfolios = function() {
        load_portfolios_list($scope); // function in import.js            
    }

    $scope.load_portfolio = function() {
        load_portfolios_from_server($scope); // function in import.js            
    }

	load_modules_list($scope);

    $scope.export_portfolio = function(format) {
        if (format === 'json') {
            export_to_json_file($scope.portfolio, "portfolio.json"); // function in export.js
        } else if (format === 'csv') {
            columns = ["id",
                "type",
                "sub_portfolio",
                "notional",
                "quantity",
                "market_value",
                "currency",
                "maturity",
                "tenor",
                "fixed_rate",
                "float_current_rate",
                "float_spread",
                "calendar",
                "dcc",
                "bdc",
                "float_tenor",
                "float_dcc",
                "float_bdc",
                "effective_date",
                "first_date",
                "next_to_last_date",
                "stub_end",
                "stub_long",
                "repay_amount",
                "repay_tenor",
                "repay_first_date",
                "repay_next_to_last_date",
                "repay_stub_end",
                "repay_stub_long",
                "interest_capitalization",
                "linear_amortization",
                "fixing_first_date",
                "fixing_next_to_last_date",
                "fixing_stub_end",
                "fixing_stub_long",
                "conditions_valid_until",
                "residual_spread",
                "disc_curve",
                "fwd_curve",
                "surface",
                "spread_curve",
                "settlement_days",
                "cap_rate",
                "floor_rate",
                "is_payer",
                "is_short",
                "current_accrued_interest",
                "first_exercise_date",
                "call_tenor",
                "opportunity_spread",
                "excl_margin",
                "simple_calibration"
            ];
            export_to_csv_file($scope.portfolio, "portfolio.csv", columns); // function in export.js
        }
    }

    $scope.view = function(item) {
        $scope.editor.index = -1;
        $scope.editor.json = JSON.stringify(item, repl, 1);
        window.scrollTo(0, 0);
    }

    $scope.create = function() {
        $scope.view({
            id: 'new_item',
            type: 'bond',
            sub_portfolio: 'bonds',
            notional: 10000,
            quantity: null,
            market_value: null,
            currency: 'EUR',
            maturity: '2030-01-01',
            tenor: 1,
            fixed_rate: 0.01,
            float_current_rate: null,
            float_spread: null,
            calendar: null,
            dcc: null,
            bdc: null,
            float_tenor: null,
            float_dcc: null,
            float_bdc: null,
            effective_date: null,
            first_date: null,
            next_to_last_date: null,
            stub_end: null,
            stub_long: null,
            repay_amount: null,
            repay_tenor: null,
            repay_first_date: null,
            repay_next_to_last_date: null,
            repay_stub_end: null,
            repay_stub_long: null,
            interest_capitalization: null,
            linear_amortization: null,
            fixing_first_date: null,
            fixing_next_to_last_date: null,
            fixing_stub_end: null,
            fixing_stub_long: null,
            conditions_valid_until: null,
            residual_spread: null,
            disc_curve: null,
            fwd_curve: null,
            surface: null,
            spread_curve: null,
            settlement_days: null,
            cap_rate: null,
            floor_rate: null,
            is_payer: null,
            is_short: null,
            first_exercise_date: null,
            call_tenor: null,
            opportunity_spread: null
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

    $scope.edit = function(item) {
        $scope.editor.index = $scope.portfolio.indexOf(item);
        $scope.editor.json = JSON.stringify(item, repl, 1);
        window.scrollTo(0, 0);
    }

    $scope.remove = function(item) {
        var i = $scope.portfolio.indexOf(item);
        $scope.portfolio.splice(i, 1);
    }

    $scope.add_as_new = function() {
        if ($scope.editor.json) {
            if ($scope.portfolio === null) $scope.portfolio = [];
            var item = JSON.parse($scope.editor.json)
            var i = 0,
                id = item.id || '';
            while (!is_unique_id(id)) {
                id = item.id + '_' + i;
                i++;
            }
            item.id = id;
            $scope.portfolio.unshift(item);
            $scope.editor.index = -1;
        }
    }

    $scope.save_instrument = function() {
        if ($scope.editor.json && $scope.editor.index >= 0) {
            $scope.portfolio[$scope.editor.index] = JSON.parse($scope.editor.json);
            $scope.editor.index = -1;
        }
    }

    $scope.cancel_editor = function() {
        $scope.editor = {
            json: null,
            index: -1
        }
    }


    $scope.$watch('editor.json', function() {

        $scope.editor.valid = false;
        $scope.editor.msg = "";
        try {
            JsonRisk.valuation_date = new Date(2000, 0, 1);
            JsonRisk.get_internal_object(JSON.parse($scope.editor.json)); //test if JSON is valid at all and if instrument is valid

        } catch (e) {
            $scope.editor.msg = e.message;
            return 0;
        }
        $scope.editor.valid = true;
    }, true);

    function repl(key, value) {
        if (key === '$$hashKey') return undefined; //exclude angluarJS internal variable
        return value;
    }

    function is_unique_id(str) {
        for (j = 0; j < $scope.portfolio.length; j++) {
            if ($scope.portfolio[j].id === str) return false;
        }
        return true;
    }



    /*  I.ii. tab parameters  */
    $scope.params_count = null;
    $scope.count_params = function() {
        var kinds = [];
        var count = null;
        if ($scope.params.curves) kinds.push('curves');
        if ($scope.params.surfaces) kinds.push('surfaces');
        if ($scope.params.scalars) kinds.push('scalars');

        for (j = 0; j < kinds.length; j++) {
            var keys = Object.keys($scope.params[kinds[j]]);
            count = count + keys.length;
        };
        $scope.params_count = count;
        if (count === 0) $scope.params_count = null;
    }


    $scope.update_params_list = function() {
        load_params_list($scope); // function in import.js
    }

    $scope.update_params_list();

    $scope.load_params = function() {
        load_params_from_server($scope); // function in import.js            
    }

    $scope.delete_params = function() {
        $scope.params = {
            valuation_date: $scope.params.valuation_date
        };
        $scope.res = null;
        $scope.errors = null;
        $scope.warnings = null;
        $scope.params_count = null;
        $scope.upload_error = null;
        $scope.delete_results();
    }

    $scope.export_params = function() {
        export_to_json_file($scope.params, "params.json"); // Funktion aus export.js
    }

    $scope.count_scenarios_curve = function(curve) {
        return Array.isArray((curve.dfs || curve.zcs)[0]) ? (curve.dfs || curve.zcs).length : 1;
    }

    $scope.count_scenarios_surface = function(surface) {
        return Array.isArray(surface.values[0][0]) ? surface.values.length : 1;
    }

    $scope.count_scenarios_scalar = function(scalar) {
        return Array.isArray(scalar.value) ? scalar.value.length : 1;
    }

    $scope.remove_parameter = function(key, value, kind) {

        if (kind === 'scalars') {
            delete $scope.params.scalars[key];
            if (Object.keys($scope.params.scalars).length === 0) delete $scope.params.scalars;
        }
        if (kind === 'curves') {
            delete $scope.params.curves[key];
            if (Object.keys($scope.params.curves).length === 0) delete $scope.params.curves;
        }
        if (kind === 'surfaces') {
            delete $scope.params.surfaces[key];
            if (Object.keys($scope.params.surfaces).length === 0) delete $scope.params.surfaces;
        }
        if (kind === 'calendars') {
            delete $scope.params.calendars[key];
            if (Object.keys($scope.params.calendars).length === 0) delete $scope.params.calendars;
        }

        if ($scope.params_count === 1) {
            $scope.params_count = null;
            $scope.params = {
                valuation_date: $scope.params.valuation_date
            };
        } else {
            $scope.params_count = $scope.params_count - 1;
        }
        $scope.delete_results();
    }

    /*  I.ii. tab scenarios  */
    $scope.scenario_group = [];
    $scope.update_scenarios_list = function() {
        load_scenarios_list($scope); // function in import.js
    }

    $scope.update_scenarios_list();

    $scope.load_scenarios = function() {
        load_scenarios_from_server($scope); // function in import.js            
    }

    $scope.delete_scenarios = function() {
        $scope.scenario_group = [];
        $scope.display.scenario = null;
    }


	// MODULES

	$scope.sel_to_right=function(){
		let active=$scope.available_modules.select_left;
		while (active.length>0){
			var item=active.shift();
			$scope.available_modules.selection.push(item);
		}
	}

	$scope.sel_to_left=function(){
		let active=$scope.available_modules.select_right;
		while (active.length>0){
			var item=active.shift();
			var idx=$scope.available_modules.selection.indexOf(item);
			$scope.available_modules.selection.splice(idx,1);
		}
	}

	$scope.all_to_right=function(){
		$scope.available_modules.selection=JSON.parse(JSON.stringify($scope.available_modules.list));
	}

	$scope.all_to_left=function(){
		$scope.available_modules.selection=[];
	}

	$scope.move_up=function(){
		let active=$scope.available_modules.select_right;
		if (active.length===0) return;
		let item=active[0];
		let idx=$scope.available_modules.selection.indexOf(item);
		if (0===idx) return;
		$scope.available_modules.selection[idx]=$scope.available_modules.selection[idx-1];
		$scope.available_modules.selection[idx-1]=item;
	}


	$scope.move_down=function(){
		let active=$scope.available_modules.select_right;
		if (active.length===0) return;
		let item=active[0];
		let idx=$scope.available_modules.selection.indexOf(item);
		if ($scope.available_modules.selection.length-1===idx) return;
		$scope.available_modules.selection[idx]=$scope.available_modules.selection[idx+1];
		$scope.available_modules.selection[idx+1]=item;
	}

    /*  I.ii. tab results  */
    $scope.open_report = function() {
        // prepare data as returned by results api
		let data={
			results: JSON.parse(JSON.stringify($scope.res)),
			meta: {
                scenario_groups: [$scope.scenario_group]
            }
		};
        report = window.open('/reports', '_blank');
        report.addEventListener('load', function(event) {
            report.angular.element(document.body).scope().load_local(data);
        });
    }

    $scope.clear_errors = function() {
        $scope.errors = null;
    }
    $scope.clear_errors_ids = function() {
        $scope.analytics.errors_ids = null;
    }

    $scope.clear_warnings = function() {
        $scope.warnings = null;
    }

    $scope.cancel = function() {
        while (wrk.length) {
            wrk[0].terminate();
            wrk.shift();
        }
        $scope.busy = false;
        $scope.res = null;
        $scope.$apply();
    }

    $scope.delete_results = function() {
        $scope.res = null;
        $scope.errors = null;
        $scope.warnings = null;
        $scope.analytics.error_count = null;
        $scope.analytics.warning_count = null;
        $scope.analytics.errors_ids = null;
    }

    $scope.add_error = function(obj) {
        if (!$scope.errors) $scope.errors = []; //first error
        var j = 0;
        while (j < $scope.errors.length) {
            if ($scope.errors[j].msg === obj.msg) { //same error has already occured
                $scope.errors[j].count += obj.count;
                break;
            }
            j++;
        }
        if (j >= $scope.errors.length) {
            $scope.errors.push(obj); //new error           
        }

    }

    $scope.add_warning = function(obj) {
        if (!$scope.warnings) $scope.warnings = [];
        var j = 0;
        while (j < $scope.warnings.length) {
            if ($scope.warnings[j].msg === obj.msg) { //same warning has already occured
                $scope.warnings[j].count += obj.count;
                break;
            }
            j++;
        }
        if (j >= $scope.warnings.length) $scope.warnings.push(obj); //new warning

    }



    $scope.calculate = function() {

        $scope.analytics.error_count = 0;
        $scope.analytics.warning_count = 0;
        $scope.analytics.errors_ids;
        $scope.busy = true;
        $scope.conc = navigator.hardwareConcurrency;
        var t0 = new Date().getTime(),
            t1, t1_last = 0;
        var i, j;
        var sub_portfolio;
        var unsent = $scope.portfolio.length;
        var incomplete = unsent;

        var params = Object.assign({}, $scope.params, {
            scenario_groups: $scope.scenario_group.length ? [$scope.scenario_group] : []
        });

        // aggregate results by sub_portfolio			
        var aggr = new jr_aggregator(['sub_portfolio']);

        for (i = 0; i < $scope.conc; i++) {
            wrk[i] = new Worker('/assets/js/worker.js');
            wrk[i].onmessage = function(e) {
                if (e.data.res) { //success
                    aggr.append([e.data.res]);
                    incomplete--;
                } else if (e.data.warning) { //warning
                    $scope.add_warning({
                        msg: e.data.msg,
                        id: e.data.id,
                        count: 1
                    });
                    $scope.analytics.warning_count = $scope.analytics.warning_count + 1;
                } else { //error
                    $scope.add_error({
                        msg: e.data.msg || "unknown error",
                        id: e.data.id || "unknown",
                        count: 1
                    });
                    $scope.analytics.error_count = $scope.analytics.error_count + 1;
                    if ($scope.analytics.errors_ids === null) {
                        $scope.analytics.errors_ids = e.data.id;
                    } else {
                        $scope.analytics.errors_ids = $scope.analytics.errors_ids + ", " + e.data.id;
                    }
                    incomplete--;

                }

                if (0 === incomplete) { //all done, terminate workers and exit
                    while (wrk.length) {
                        wrk[0].terminate();
                        wrk.shift();
                    }
                    $scope.remaining = 0;
                    $scope.busy = false;
                    $scope.res = aggr.results;
                    $scope.$apply();
                }
                if (incomplete % 100 === 0) { //every now and then, update display and stats
                    t1 = new Date().getTime();
                    $scope.calctime = (t1 - t0) / 1000;
                    $scope.remaining = incomplete;
                    if (t1 - t1_last > 500) {
                        $scope.$apply();
                        t1_last = t1;
                    }
                }
                if (unsent > 0) { // queue next instrument while not done
                    this.postMessage({
                        instrument: $scope.portfolio[unsent - 1]
                    });
                    unsent--;
                }
            }

            //worker process error handling
            wrk[i].onerror = function(e) {
                $scope.add_error({
                    msg: "An error occurred in the worker process. " + (e.message || ""),
                    id: 'unknown',
                    count: 1
                });
            }

            //send params to worker
            wrk[i].postMessage({
                params: params,
				modules: $scope.available_modules.selection
            });

            //post initial instrument
            if (unsent > 0) {
                wrk[i].postMessage({
                    instrument: $scope.portfolio[unsent - 1]
                });
                unsent--;
            }

            //post one more instrument to keep workers busy
            if (unsent > 0) {
                wrk[i].postMessage({
                    instrument: $scope.portfolio[unsent - 1]
                });
                unsent--;
            }
        }
    }

    /* II. general functions */
    $scope.import_file = function(type, kind, url) {

        if (type === 'csv') {
            if (url) return import_data(url, kind, $scope);
            var f = document.createElement('input');
            f.setAttribute('type', 'file');
            f.addEventListener('change', function(evt) {
                import_data_csv(evt.target.files[0], kind, $scope);
            }, false);
            f.click();
            return 0;
        } else if (type === 'json') {
            var uploadDatei;
            var f = document.createElement('input');
            f.setAttribute('type', 'file');
            f.addEventListener('change', function(evt) {
                import_data_json(evt.target.files[0], kind, $scope);
            }, false);
            f.click();
            return 0;
        }
    }




}]);
