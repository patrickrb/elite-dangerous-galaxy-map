angular.module('edGalaxyMap')
.directive('colorSelection', function ($rootScope, $q, colorService, $uibModal) {
	return {
		restrict : 'E',
		templateUrl : 'scripts/directives/colorSelection/colorSelection.html',
		link : function ($scope, elem, attr) {
			$scope.$on('selectedSystem:update', function (event, data) {
				$scope.selectedSystem = data;
			});

			$scope.$on('systemColoring:update', function(event, newColorKey) {
				$scope.colorNames = colorService.getColorNames();
				$scope.activeColors = colorService.getActiveColors();
			});

			$scope.updateColorFlags = function(index) {
				colorService.setColorActive(index, $scope.activeColors[index]);
				$rootScope.$broadcast("systemColoring:updateActives");
			};

			$scope.colorNames = colorService.getColorNames();
			$scope.activeColors = colorService.getActiveColors();

			$scope.colors = colorService.colorPalette;

		}
	}
});
