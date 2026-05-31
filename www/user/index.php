<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

require_once 'assets/php/Exception.php';
require_once 'assets/php/PHPMailer.php';
require_once 'assets/php/SMTP.php';

function send_token($user, $redirect=false){
	$exp=new DateTimeImmutable();
	$exp=$exp->getTimestamp();
	$exp+=30*60; # token expires in 30 minutes
	$token=['sub' => $user->sub, 
		'ins' => $user->ins, 
		'per' => $user->per,
		'exp' => $exp
	];

	# send signed token per httponly cookie securely	
    $secure = !in_array($_SERVER['HTTP_HOST'], [
        'localhost',
        '127.0.0.1'
    ]);

    setcookie('access_token', tokenize($token), [
        'expires'  => $exp,
        'path'     => '/',
        'secure'   => $secure,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
	
	# send non-signed token info per http response for information purposes
	if ($redirect){
		header('Location: /');
		exit();	
	}
	succeed($token);
}

function send_login_link($user){

	$exp=new DateTimeImmutable();
	$exp=$exp->getTimestamp();
	$exp+=3*60; # token expires in 3 minutes
	$token=['sub' => $user->sub, 
		'ins' => $user->ins, 
		'per' => 'l',
		'exp' => $exp
	];

	$token=tokenize($token);	
	#send mail

	global $jr;
	$conf=$jr->webroot . '/../.security.json';
	$conf=file_get_contents($conf);
	if (!$conf) fail(401, "Cannot send email link, no mail configuration found" );
	$conf=json_decode($conf, false);
	if (!$conf) fail(401, "Cannot send email link, invalid mail configuration file");
	if(!property_exists($conf,'mail')) fail(401, "Cannot send email link, review mail configuration");
	$conf=$conf->mail;
	if(!property_exists($conf,'host') 
		or !property_exists($conf,'port')
		or !property_exists($conf,'username')
		or !property_exists($conf,'password')) fail(401, "Cannot send email link, review mail configuration");

	if(!property_exists($conf,'external_host')){
		$url=stripos($_SERVER['SERVER_PROTOCOL'],'https') === 0 ? 'https://' : 'http://';
	    $url.=$_SERVER['SERVER_NAME'] . ":" . $_SERVER['SERVER_PORT'];
	}else{
		$url=$conf->external_host;
	}
	$url.= '/api/user/token/' . $token;

	$subject='JSON risk login';
	$from = 'donotreply@jsonrisk.de';
	$fromname = 'JSON risk login';
	$body= "
	<html>
	<head>
	  <title>JSON risk login</title>
	</head>
	<body>
		<p>Log in with this <a href=\"$url\">link</a>.</p>
	</body>
	</html>
	";

	$mail = new PHPMailer(true);
	$mail->isSMTP();
	$mail->Host = $conf->host;
	$mail->Port = $conf->port;
	$mail->SMTPAuth = true;
	$mail->Username = $conf->username;
	$mail->Password = $conf->password;

	$mail->From=($from);
	$mail->FromName=($fromname);
	$mail->Subject = $subject;
	$mail->MsgHTML($body);
	$mail->AddAddress($user->ema);	
	if(!$mail->Send()) fail("Cannot send email link, review mail configuration");

	succeed("Login link was sent to " . $user->ema);
}

function user_exists($instance, $user){
	global $jr;
	$tmp=$jr->datadir . '/' . $instance . '/user/' . $user . '.json';
	$tmp=file_get_contents($tmp);
	if (!$tmp) return false;
	return true;
}


function read_user_file($instance, $user){
	global $jr;
	$tmp=$jr->datadir . '/' . $instance . '/user/' . $user . '.json';
	$tmp=file_get_contents($tmp);
	if (!$tmp) fail(401, "User or instance does not exist");
	$tmp=json_decode($tmp, false);
	if (!$tmp) fail(401, "User or instance does not exist");
	if (isset($tmp->inactive)){
		if ($tmp->inactive) fail(401, "User is not active");
	}
	$tmp->ins=$instance;
	return $tmp;
}


function store_user_file($user){
	global $jr;
	if ('nobody'==$user->sub) return;
	$directory=$jr->datadir . '/' . $user->ins . '/user/';
	if (!is_writable($directory)) fail(500, "Could not store user info in data directory");
	$filename=$directory . $user->sub . '.json';
	$tempname=tempnam($directory,'.temp');
	
	$data=json_encode($user, JSON_PRETTY_PRINT);
	
	if (!file_put_contents($tempname,$data)) fail(500, "Could not store user info in temp file");
	if (!rename($tempname,$filename)) fail(500, "Could not store user info in target file");	
	return 0;
}

function token(){
	global $jr;
	global $user;
	// GET: if user has valid token, refresh it
	if ('GET' == $_SERVER['REQUEST_METHOD'] && isset($user->sub) && isset($user->ins)){
		if ('nobody'!=$user->sub){	
			$temp=read_user_file($user->ins, $user->sub);
			if (true == $temp->locked) fail(401, "User is locked.");
			send_token($temp);
		}
	}

	// GET: if user has a login claim (from a login link), issue access token and redirect to home page
	if ('GET' == $_SERVER['REQUEST_METHOD'] && '' != $jr->path_array[3] ){
		$temp = detokenize($jr->path_array[3]);
		if (null == $temp) fail(401, "Invalid authorization token.");
		if (!isset($temp->sub)) fail(401, "Invalid login token.");
		if (!isset($temp->ins)) fail(401, "Invalid login token.");
		if (!isset($temp->per)) fail(401, "Invalid login token.");
		if (false===strpos($temp->per,'l')) fail(401, "Invalid login token.");
		// valid token, read user permissions from file and issue access token
		
		$temp=read_user_file($temp->ins, $temp->sub);
		if (true == $temp->locked) fail(401, "User is locked.");
		send_token($temp, true);
	}

	// GET: fail otherwise
	if ('GET' == $_SERVER['REQUEST_METHOD']) fail(401, "Must submit token.");

	// POST : user not yet authenticated
	if ('POST' == $_SERVER['REQUEST_METHOD']){
		if(!isset($_POST['sub'])) fail(401, "Must submit subject identity.");
		if(!isset($_POST['ins'])) fail(401, "Must submit instance.");
		
		$temp=read_user_file($_POST['ins'],$_POST['sub']);
		if (true == $temp->locked) fail(401, "User is locked.");
			
		if(isset($_POST['pwd'])){
			// user has submitted credentials, log her in
			if (!password_verify($_POST['pwd'],$temp->has)) fail(401, "Invalid password.");
			unset($temp->has);
			send_token($temp);
		}else{
			// if user has submitted name, send login token to her email address
			if(!isset($temp->ema)) fail(401, "Cannot send email link.");
			send_login_link($temp);
		}
	}
	fail(405, "Invalid request method");
}

function password(){
	global $user;
	// support POST only
	if ('POST' == $_SERVER['REQUEST_METHOD']){
		if(!isset($_POST['pwd'])) fail(400, "Must submit pwd.");
		if(!isset($_POST['pwd2'])) fail(400, "Must submit pdw2");
		$pwd=$_POST['pwd'];
		$pwd2=$_POST['pwd2'];
		if ($pwd!=$pwd2) fail(400, "Passwords pwd1 and pwd2 must match");

		if ('nobody'==$user->sub) fail(400, "Cannot reset password for nobody.");
				
		$temp=read_user_file($user->ins,$user->sub);
		
		if(''==$pwd){
			$temp->has=null;
		}else{
			$temp->has=password_hash($pwd, PASSWORD_DEFAULT);
		}
		store_user_file($temp);
		succeed("Password updated.");
	}
	fail(405, "Invalid request method");
}

function logout(){
	setcookie(
		'access_token',
		'deleted',
		1,  	# expires in the past, deletes cookie
		'/', 	# path
		'', 	# domain    
		false, 	# secure
		true	# httponly
	);
	global $nobody;
	succeed($nobody);	
}

switch ($jr->path_array[2]){
	case 'token':
		token();
		break;
	case 'password':
		password();
		break;
	case 'logout':
		logout();
		break;
	case 'mgmt':
		include $jr->webroot . '/user/mgmt.php';
		break;
	case '':
		succeed(array('token','logout','password','mgmt'));
	default:
		fail(404, "Invalid API endpoint.");
}

?>
