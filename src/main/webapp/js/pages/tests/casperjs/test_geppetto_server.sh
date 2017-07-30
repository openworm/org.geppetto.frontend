#!/bin/sh
Test () {
	    request_cmd="$(curl -i -o - --silent -X GET --header 'Accept: application/json' --header 'Authorization: _your_auth_code==' 'http://localhost:28081/org.geppetto.frontend')"
		http_status=$(echo "$request_cmd" | grep HTTP |  awk '{print $2}')
		echo $http_status
		if [ "$http_status" == "302" ]; then
			echo "$(date) - connected successfully!"
		else
			echo "Waiting for docker to finish building.";
  			sleep 15
  			Test
		fi
}

Test