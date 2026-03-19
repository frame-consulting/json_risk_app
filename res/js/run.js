const fs=require('fs'); // file system functions
const auth=require('./auth.js'); // authentication functions
const util=require('./util.js'); // authentication functions
const instance=process.argv[2];
const run_name=process.argv[3];
const jr_root=process.env['JR_ROOT'];
const jr_datadir=process.env['JR_DATADIR'];
const jr_hostname=process.env['JR_HOSTNAME'];
const jr_port=process.env['JR_PORT'];
const JsonRisk=require(`${jr_root}/www/assets/js/json_risk.js`);
const module_support=require(`${jr_root}/www/assets/js/module_support.js`);


// fail fast if paths are not set or file does not exist
const run_info_file=`${jr_datadir}/${instance}/runs/${run_name}.json`;
if (false===fs.existsSync(run_info_file)){
    util.jr_fail(`Run info file ${run_info_file} does not exist`, 1);
}

// cluster config
let jr_external_hostname=`http://${jr_hostname}:${jr_port}`; // default value, no cluster config
let jr_cluster_urls=[jr_external_hostname]; // default value, no cluster config
try{
   let cc=fs.readFileSync(`${jr_root}/.cluster.json`);
   cc=JSON.parse(cc);
   if(cc.external_hostname) jr_external_hostname=cc.external_hostname;
   if(Array.isArray(cc.cluster_urls)) jr_cluster_urls=cc.cluster_urls;
}catch(e){
    util.jr_warn(`Using default single node setup, could not read cluster config, ${e.message}`, 1);
}
const http = jr_external_hostname.startsWith("https://") ? require("https") : require("http");

// load file
try{
    run_info=fs.readFileSync(run_info_file);
    run_info=JSON.parse(run_info);
    run_info.name=run_name;
}catch(err){
    util.jr_fail(`Could not load run info file ${run_info_file}: ${err.message}.`, 1);
}

// check if valid run info is in file
if (!Array.isArray(run_info.portfolios)){
    util.jr_fail(`Invalid run info file ${run_info_file}: Does not contain portfolio info`, 1);
}

if (!Array.isArray(run_info.params)){
    util.jr_fail(`Invalid run info file ${run_info_file}: Does not contain parameters info`, 1);
}

// check if portfolio and params are nonempty
if (0===run_info.portfolios.length){
    util.jr_fail(`Invalid run info file ${run_info_file}: Contains empty portfolio info`, 1);
}

if (0===run_info.params.length){
    util.jr_fail(`Invalid run info file ${run_info_file}: Contains empty parameters info`, 1);
}

// check if scenarios and modules are arrays or nothing
if (!Array.isArray(run_info.scenario_groups || [])){
    util.jr_fail(`Invalid run info file ${run_info_file}: Contains invalid scenario info`, 1);
}

if (!Array.isArray(run_info.modules || [])){
    util.jr_fail(`Invalid run info file ${run_info_file}: Contains invalid module info`, 1);
}

// normalize valuation date as YYYY-MM-DD after checking validity
const d=JsonRisk.date_or_throw(run_info.valuation_date);
if (!d){
    util.jr_fail(`Invalid run info file ${run_info_file}: Does not contain valid valuation date`, 1);
}
run_info.valuation_date=util.format_date(d);

// find run id
let run_id=0;
let run_dir=`${jr_datadir}/${instance}/runs/${run_id.toFixed(0)}`;
while(true){
    try{
        fs.mkdirSync(run_dir,{recursive: false, mode: 0755});
        break;
    }catch(err){
        if ('EEXIST'===err.code){
            run_id++;
            run_dir=`${jr_datadir}/${instance}/runs/${run_id.toFixed(0)}`;
        }else{
            util.jr_fail(`Could not create run dir ${run_dir}: ${err.code}`, 1);     
        }
    }
}

// dump run info into run dir
try{
    fs.writeFileSync(run_dir + '/run.json.tmp', JSON.stringify(run_info,null,1),{mode: 0644, flag: 'w', flush: true});
    fs.renameSync(run_dir + '/run.json.tmp',run_dir + '/run.json');
}catch(err){
    util.jr_fail(`Could not write run info to ${run_dir}: ${err.message}.`, 1);
}

// now that run dir is set up, we log the status into run dir
const status_info={
    status: 'running',
    has_warnings: false,
    percentage: 0
};

const warnings=[];

const jr_fail=function(msg){
    status_info.status='failed';
    status_info.message=msg;
    let message=util.jr_fail(msg); // formats message and logs to stdout
    write_status();
    try{
        fs.writeFileSync(run_dir + '/run.log', message + '\n',{mode: 0644, flag: 'a', flush: true});
    }catch{}
    process.exit(1);
}

const jr_warn=function(msg){
    status_info.has_warnings=true;
    warnings.push(msg);
    let message=util.jr_warn(msg); // formats message and logs to stdout
    try{
        fs.writeFileSync(run_dir + '/run.log', message + '\n',{mode: 0644, flag: 'a', flush: true});
    }catch{}
}

const jr_log=function(msg){
    let message=util.jr_log(msg); // formats message and logs to stdout
    try{
        fs.writeFileSync(run_dir + '/run.log', message + '\n',{mode: 0644, flag: 'a', flush: true});
    }catch{}
}


const jr_debug=function(msg){
    let message=util.jr_debug(msg); // formats message and logs to stdout
    if(!message) return;
    try{
        fs.writeFileSync(run_dir + '/run.log', message + '\n',{mode: 0644, flag: 'a', flush: true});
    }catch{}
};

const write_status=function(){
    try{
        fs.writeFileSync(run_dir + '/status.json.tmp', JSON.stringify(status_info,null,1),{mode: 0644, flag: 'w', flush: true});
        fs.renameSync(run_dir + '/status.json.tmp',run_dir + '/status.json');
    }catch(err){
        jr_fail(`Could not write status info to ${run_dir}: ${err.message}`);
    }
}

const write_warnings=function(){
    try{
        fs.writeFileSync(run_dir + '/warnings.json.tmp', JSON.stringify(warnings,null,1),{mode: 0644, flag: 'w', flush: true});
        fs.renameSync(run_dir + '/warnings.json.tmp',run_dir + '/warnings.json');
    }catch(err){
        jr_fail(`Could not write warnings file to ${run_dir}: ${err.message}`);
    }
}

// get token
let token=auth.token(instance, 'rwx' , 10);

// start downloading items
jr_log('Downloading portfolio, parameters, scenarios and modules');

const Download=function(path, callback){
    let _done=false;
    this.done=function(){
        return _done;
    };
    this.path=path;
    const options={
        headers: {
            authorization: "Bearer " + token
        }
    }
    const url=jr_external_hostname + '/' + path;
    const req=http.get(url, options, (res) => {
        if (res.statusCode !== 200){
            jr_fail(`Download of ${path} has failed`);
        }
        let data=''; 
        res.on('data', (chunk) => {
            data+=chunk;
        });
        res.on('end', () => {
            callback(data, path);
            _done=true;
            status_update();
        });
    });

    req.on('error', (e) => {
        jr_fail(`Download of ${path} failed with ${e.message}`);
    });
    return this;
}
downloads=[];

// portfolio download
var portfolio=[];
const callback_portfolio=function(raw, path){
    try{
        let obj=JSON.parse(raw);
        portfolio=portfolio.concat(obj);
        jr_log(`Got portfolio data from ${path}`);
    }catch(err){
        jr_fail(`Could not parse portfolio data from ${path}, ${err.message}`);
    }
}

for (let p of run_info.portfolios){
    downloads.push(new Download('api/portfolio/' + p, callback_portfolio));
}

// params download
var params=null;
const callback_params=function(raw, path){
    try{
        let obj=JSON.parse(raw);
        params=obj;
        jr_log(`Got base params data from ${path}`);
    }catch(err){
        jr_fail(`Could not parse params data from ${path}, ${err.message}`);
    }
}

downloads.push(new Download('api/params/' + run_info.params[0], callback_params));

// scenarios download
const scenario_groups=[];
const callback_scenarios=function(raw, path){
    try{
        let obj=JSON.parse(raw);
        scenario_groups.push(obj);
        jr_log(`Got scenario data from ${path}`);
    }catch(err){
        jr_fail(`Could not parse scenario data from ${path}, ${err.message}`);
    }
}

for (let s of run_info.scenario_groups || []){
    downloads.push(new Download('api/scenarios/' + s, callback_scenarios));
}

// module download
const modules=[];
const callback_modules=function(raw, path){
    try{
        let m=module_support.from_string(raw,path);
        m.name=path.slice('api/modules/'.length);
        m.source=raw;
        modules.push(m);
        jr_log(`Got module data from ${path}`);
        // dependencies
        for (let d of m.depends || []){
            let p='api/modules/'+d;
            if (downloads.some((x)=>{return x.path===p})) continue; // no double downloads
            downloads.push(new Download(p, callback_modules));
        }
    }catch(err){
        jr_fail(`Could not parse module data from ${path}, ${err.message}`);
    }
}

for (let m of run_info.modules || []){
    downloads.push(new Download('api/modules/' + m, callback_modules));
}

// function for filtering portfolio
const filter_portfolio=function(){
    for (let m of modules){
        if ('function' === typeof m.instrument_filter){
            portfolio=portfolio.filter(m.instrument_filter);
        }
    }
    if (0===portfolio.length) jr_fail("No instruments in portfolio after filtering, cannot continue.");
}

// function for combination and upload of params
let params_url=null;
const upload_params=function(){
    jr_log('Uploading parameters package');

    // add scenarios
    params.scenario_groups=scenario_groups;

    // set valuation date
    params.valuation_date=run_info.valuation_date;

    // sort modules by dependency and add base64url encoded source
    module_support.sort_modules(modules);
    params.modules=modules.map((m) => {return {name: m.name, source: Buffer.from(m.source, 'utf8').toString('base64url')};});

    // upload to temp store for access by calculation server
    const options={
        headers: {
            authorization: "Bearer " + token,
            "Content-Type": 'multipart/form-data; charset=utf-8; boundary={:}'
        },
        method: 'POST'
    }
    const url=jr_external_hostname + '/api/params';

    let req=http.request(url, options, (res) => {
	    let data='';	
	    res.setEncoding('utf8');
	    res.on('data', (chunk) => {
    		data+=chunk;
	    });
	    res.on('end', () => {
            try{
    		    data=JSON.parse(data);
            }catch(e){
                jr_fail(`Could not upload params to ${url}, server does not return valid JSON: ${e.message}`);
            }
		    if (data.path){ 
			    params_url=jr_external_hostname + '/api/params/' + data.path;
			    jr_log(`Params made available under ${params_url}`);
                status_update();
		    }else{
			    jr_fail(`Could not upload params to ${url}, server returns: ${data.message}`);
		    }
	    });
    });

    req.on('error', (e) => {
	    jr_fail(`Could not upload params to ${url}, server returns: ${e.message}`);
    });

    // must send params file with multipart/form-data encoding
    req.write('--{:}\r\n');
    // set option temp=true to enable temp store on server
    req.write('Content-Disposition: form-data; name="temp"\r\n\r\n');
    req.write('true\r\n');
    req.write('--{:}\r\n');
    req.write('Content-Disposition: form-data; name="file"; filename="file"\r\n');
    req.write('Content-Type: application/json\r\n\r\n');
    req.write(JSON.stringify(params));
    req.write('\r\n--{:}--');
    req.end();

    // delete params when sent
    params=null;
}


// function for storing results on the file system for reporting
const results_dir=`${jr_datadir}/${instance}/results/${run_info.valuation_date}/${run_name}`;
const results_tmp_dir=`${results_dir}.${Date.now()}.tmp`;
const results_old_dir=`${results_dir}.old`;

let results_index=0;
const store_results=function(results){
    let results_path=`${results_tmp_dir}/${Math.trunc(results_index / 1000).toFixed(0)}`;
    let results_file=`${results_path}/${results_index.toFixed(0)}.json`;
    try{
        fs.mkdirSync(results_path,{recursive: true, mode: 0755});
        fs.writeFileSync(results_file, JSON.stringify(results,null,1),{mode: 0644, flag: 'w'});
    }catch(e){
        jr_fail(`Could not store results on ${results_tmp_dir}: ${e.message}`);
    }
    results_index++;

    // first time this is called, also store scenarios in meta file
    if(null===scenario_groups) return;
    let meta_file=`${results_tmp_dir}/meta.json`;
    let meta={scenario_groups};
    try{    
        fs.writeFileSync(meta_file, JSON.stringify(meta,null,1),{mode: 0644, flag: 'w'});
    }catch(e){
        jr_fail(`Could not store results metadata on ${results_tmp_dir}: ${e.message}`);
    }
}

const finalize_result_dir=function(){
    try{
        // remove old dir if exists
        fs.rmSync(results_old_dir, {force: true, maxRetries: 3, recursive: true});
        // move existing dir to old dir
        if(fs.existsSync(results_dir)){
            fs.renameSync(results_dir, results_old_dir);
        }
        // move new results to their final location
        fs.renameSync(results_tmp_dir, results_dir);
    }catch(e){
        jr_fail(`Could not move results to their final location: ${e.message}`);
    }        

    // if possible, delete "new" old dir, but do not really care if this fails.
    try{
        fs.rmSync(results_old_dir, {force: true, maxRetries: 0, recursive: true});
    }catch(e){
        jr_warn(`Could not remove ${results_old_dir}: ${e.message}`);
    }
}

// define status update loop and set interval
let cluster=null;
const status_update=function(){
    // download phase
    if (downloads){
        let msg='Downloading portfolio, parameters, scenarios and modules';
        status_info.message=msg;
        write_status();
        for (let d of downloads){
            // check if all downloads are done
            if (!d.done()) return;
        }
        // all downloads are done, filter portfolio and upload params
        downloads=null;
        filter_portfolio();
        upload_params();
        return;
    }

    
    // params upload phase - finished when params_url is set
    if(null===params_url){
        let msg='Uploading parameters package';
        status_info.message=msg;
        write_status();
        return;
    }

    // start calculations if not done yet
    if(null===cluster){
        let msg='Starting calculations...';
        jr_log(msg);
        status_info.message=msg;
        write_status();
        cluster=require('./cluster.js'); // manage calculation requests
        cluster.instance(instance);
        cluster.portfolio(portfolio);
        cluster.params_url(params_url);
        cluster.success_callback(store_results);
        cluster.debug_callback(jr_debug);
        cluster.error_callback(jr_fail);
        cluster.info_callback(jr_log);
        for (let c of jr_cluster_urls){
            cluster.add_url(c);
        }
        return;
    }

    // calculation phase - check cluster and exit when done
    let s=cluster.status();
    Object.assign(status_info,s);
    status_info.percentage=(100*(status_info.instruments_total - status_info.instruments_remaining) / status_info.instruments_total).toFixed(0);
    status_info.message=`Calculating on ${status_info.nodes_total} nodes (${status_info.nodes_online} online), ${status_info.instruments_remaining} instruments remaining, ${status_info.percentage} percent done`;
    write_status();
    if(0===s.instruments_remaining){
        finalize_result_dir();
        status_info.message=`Done, ${status_info.instruments_total} instruments simulated`;
        jr_log(status_info.message);
        status_info.status='completed';
        write_status();
        process.exit(0);
    }
}

setInterval(status_update, 10*1000);
