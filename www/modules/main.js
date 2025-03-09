function render_modules_list(modules){
	var list=document.getElementById('modules');
	var item,a,span,module;
    while(modules.length>0){
		module=modules.shift();
		item=document.createElement('li');
		item.classList.add('nav-item');
		a=document.createElement('a');
		a.classList.add('nav-link');
		a.setAttribute('onclick', `update_code("${module}");`);
		a.setAttribute('href', '#');
		a.innerHTML=`<span data-feather="code"></span>${module}`;
		item.appendChild(a);
		list.appendChild(item);
	}
	feather.replace();
}

function update_modules_list(){
	var req=new XMLHttpRequest();

	req.addEventListener('load', function(evt){
		if(req.status===200){
			let result=JSON.parse(req.responseText);
			if (result.success){
				if(Array.isArray(result.res)){
					render_modules_list(result.res);
				}else{
					alert("Internal application error.");	
				}
			}else{
				alert("Internal application error.");	
			}
		}else{
			alert("Internal application error.");	
		}
	});

	req.addEventListener('error', function(evt){
		alert("Internal application error.");	
	});

	req.open('GET', '/api/modules');         
	req.send();
}

function update_code(module){
	var req=new XMLHttpRequest();
	var code=document.getElementById('code');

	req.addEventListener('load', function(evt){
		if(req.status===200){
			let content=req.responseText;
            content=content.replaceAll('&', "&amp;")
            .replaceAll('<', "&lt;")
            .replaceAll('>', "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
			code.innerHTML=content;
			code.classList.remove('prettyprinted');
			prettyPrint();
		}else{
			alert("Internal application error.");	
		}
	});

	req.addEventListener('error', function(evt){
		alert("Internal application error.");	
	});

	req.open('GET', '/api/modules/' + module);         
	req.send();
}


window.addEventListener('load',update_modules_list);
