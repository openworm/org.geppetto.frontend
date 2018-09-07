#!/bin/sh
iterations=1
Test () {
	    request_cmd="$(curl -i -o - --silent -X GET --header 'Accept: application/json' --header 'Authorization: _your_auth_code==' 'http://localhost:28081/org.geppetto.frontend')"
		http_status=$(echo "$request_cmd" | grep HTTP |  awk '{print $2}')
		echo $http_status
		if [ "$http_status" == "302" ]; then
			echo "$(date) - connected successfully!"
		else
			if [ "$iterations" == "100" ]; then
				exit 0
			else
				echo "Waiting for docker to finish building.";
				iterations=$((iterations+1))
  				sleep 1
  				Test
			fi
		fi
}

Test
