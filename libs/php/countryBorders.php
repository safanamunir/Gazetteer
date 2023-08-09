<?php

    $executionStartTime = microtime(true) / 1000;

    

    $countryBorders= file_get_contents('../../countryBorders.json');

 

    $decode = json_decode($countryBorders, true);

 

    $countries =[];

 

    for ($i=0; $i < count($decode["features"]); $i++) { 

        # code...

        array_push($countries, $decode["features"][$i]["properties"]);

    }

 

    $output['status']['code'] = "200";

    $output['status']['name'] = "ok";

    $output['status']['description'] = "mission saved";

    $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";

    $output['data'] = $countries;

    

    header('Content-Type: application/json; charset=UTF-8');

 

    echo json_encode($output);

?>