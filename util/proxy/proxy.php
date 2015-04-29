<?php
require 'vendor/autoload.php';
use GuzzleHttp\Client;

$username = 'gerritUsername';
$password = 'gerritPassword';
$gerritUrl = 'http://yourproject.gerrit:8080/a/';

$client = new Client([
		'base_url' => [$gerritUrl, []],
		'defaults' => [        
			'auth'    => [$username, $password]        
		]	
	]);

$query = (isset($_GET['query'])) ? $_GET['query'] : false;
if(!$query) exit;

$response = $client->get($query);
$jsonArray = substr($response->getBody()->getContents(), 4);
echo $jsonArray;

?>