'use strict';

angular.module('edGalaxyMap', ['ui.bootstrap', 'ui.gravatar', 'ngRoute', 'ngCookies', 'ngMaterial'])
	.config(function ($routeProvider) {
		$routeProvider
			.when('/', {
				templateUrl: 'views/main.html',
				controller: 'MainCtrl'
			})
			.otherwise({
				redirectTo: '/'
			});
	})
	.factory('authInterceptor', function ($rootScope, $q, $cookieStore, $location) {
	return {
		// Add authorization token to headers
		request: function (config) {
			config.headers = config.headers || {};
			if ($cookieStore.get('token')) {
				config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
			}
			return config;
		},

		// Intercept 401s and redirect you to login
		responseError: function(response) {
			if(response.status === 401) {
				$location.path('/login');
				// remove any stale tokens
				$cookieStore.remove('token');
				return $q.reject(response);
			}
			else {
				return $q.reject(response);
			}
		}
	};
});
