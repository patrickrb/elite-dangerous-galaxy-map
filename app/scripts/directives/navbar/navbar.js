angular.module('edGalaxyMap')
	.directive('navbar',function ($rootScope, $q, $uibModal, systemsService, userService, colorService, $cookieStore) {
			return {
				restrict: 'E',
				templateUrl: 'scripts/directives/navbar/navbar.html',
				link: function ($scope, elem, attr) {
						$scope.changeSystem = function($item, $model, $label, $event){
							$rootScope.$broadcast('selectedSystem:update', $item);
						}

						$scope.changeColoring = function(name) {
							colorService.setColoringType(name);
							$rootScope.$broadcast('systemColoring:update', name);
						}

						//wait for systems data to load, then draw systems and animate
						$scope.$watch(function() {
				        return systemsService.systems.length;
				    }, function(newVal, oldVal) {
								if(systemsService.systems.length >= 1){
									$scope.systems = systemsService.systems;
								}
				    });

						$scope.$watch(function() {
								return userService.isLoggedIn;
						}, function(newVal, oldVal) {
							if(userService.isLoggedIn){
								$scope.user = $cookieStore.get('user');
								$scope.isLoggedIn = true
							}
							else{
								$scope.isLoggedIn = false;
							}
						});

						$scope.logout = function(){
							userService.logout();
						}

						$scope.openLoginModal = function () {
						 var modalInstance = $uibModal.open({
							 animation: $scope.animationsEnabled,
							 templateUrl: '/scripts/directives/loginModal/loginModal.html',
							 controller: 'LoginModalCtrl',
							 size: 'md'
						 });

						 modalInstance.result.then(function () {
						 }, function () {
						 });
					 };


						$scope.openRegisterModal = function () {
						 var modalInstance = $uibModal.open({
							 animation: $scope.animationsEnabled,
							 templateUrl: '/scripts/directives/registerModal/registerModal.html',
							 controller: 'RegisterModalCtrl',
							 size: 'md'
						 });

						 modalInstance.result.then(function () {
						 }, function () {
						 });
					 };
        }
      }
    });
