angular.module('edGalaxyMap')
	.directive('edSystemMap',function ($q, systemsService, $rootScope, stationsService, colorService) {
			return {
				restrict: 'E',
				link: function (scope, elem, attr) {
					window.scene;
					var camera;
					var controls;
					var colors = [];
					var particles = [];
					var uniforms;
					var renderer;
					var loadingTextMesh;
					var isLoading = true;
					var clock = new THREE.Clock();
					var particleSystem;
					var raycaster;
					var geometry;
					var backgroundScene;
					var backgroundCamera;
					var mouse = new THREE.Vector2(0, 0);
					var selectedNodes = [];
					var systemNodeData = [];
					var selectedSystemIcon;
					var targetCircle = new THREE.Object3D();
					var targetCircleGeo = new THREE.CircleGeometry(50, 64);
					var BASE_POINT_SIZE = 100;
					var POP_SIZE_THRESHOLD = 1000000000 //population > than this will start scaling point size up
					var c_pickingEnabled = true;
					var c_mouseDownPos = new THREE.Vector2();
					var targetLineMaterial = new THREE.LineBasicMaterial({color: '0xffffff'});
					var colorPaletteTexture;
					var label = $("#pointer");
					var INTERSECTED;
					//load galaxy data
					systemsService.init();
					//init the window.scene
					init();
					animate();

				scope.$on('selectedSystem:update', function(event,data) {
					scope.selectedSystem = data;
					selectedSystemIcon.visible = false;
					flyToSystem(scope.selectedSystem);
				});

				scope.$on('systemColoring:update', function(event, newColorKey) {
					var colorIndex = colorService.map_colorTypes.indexOf(newColorKey);
					if (colorIndex < 0) {
						console.error("Unknown system coloring type: "+newColorKey);
						colorIndex = 0;
					}
					uniforms.activeColoring.value = colorIndex;
					updateColorPaletteTexture();
				});

				scope.$on('systemColoring:updateActives', updateColorPaletteTexture);

				function updateColorPaletteTexture() {
					var canvas = colorService.getColorPaletteImage();
					colorPaletteTexture = new THREE.Texture(canvas);
					colorPaletteTexture.needsUpdate = true;
					colorPaletteTexture.minFilter = THREE.NearestFilter;
					colorPaletteTexture.magFilter = THREE.NearestFilter;
					uniforms.colorPalette.value = colorPaletteTexture;
				}

					//wait for systems data to load, then draw systems and animate
					scope.$watch(function() {
			        return systemsService.systems.length;
			    }, function(newVal, oldVal) {
							if(systemsService.systems.length >= 1){
								loadSystems();
								// document.getElementById("searchSystemsInput").focus();
							}
			    });

					//wait for systems data to load, then draw systems and animate
					scope.$watch(function() {
							return stationsService.stations.length;
					}, function(newVal, oldVal) {
							if(stationsService.stations.length >= 1){
								scope.stations = stationsService.stations;
							}
							else{
								scope.stations = []
							}
					});

					function loadSystems() {
						toggleSceneLoading(false);
						var texture = THREE.ImageUtils.loadTexture('models/circle.png');
						texture.minFilter = THREE.LinearFilter;
						uniforms = {

							activeColoring: { type: "i", value: 0 },
							colorPalette: { type: "t", value: null },
							texture: { type: "t", value: texture },
							scale: {type: "f", value: 1.0}

						};
						updateColorPaletteTexture();
						var shaderMaterial = new THREE.ShaderMaterial( {

							uniforms:       uniforms,
							vertexShader:   document.getElementById( 'vertexshader' ).textContent,
							fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
							depthTest:      true,
							depthWrite:     true,
							transparent:    false,
							shading:        THREE.FlatShading
						});

						geometry = new THREE.BufferGeometry();

						/*
						* This maps the property to a color index that will be used in the shader to read the right color from a texture palette
						* colorIndex (vec4)
						*   [0] = map_economy 
						*   [1] = map_allegiance
						*   [2] = map_government
						*   [3] = unused (star type?)
						*/
						var colorIndex = new Float32Array( systemsService.systems.length * 4 );
						var positions = new Float32Array( systemsService.systems.length * 3 );
						var sizes = new Float32Array( systemsService.systems.length );

						for ( var i = 0, i3 = 0; i < systemsService.systems.length; i ++, i3 += 3 ) {

							var system = systemsService.systems[i];
							positions[ i3 + 0 ] = system.x;
							positions[ i3 + 1 ] = system.y;
							positions[ i3 + 2 ] = system.z;

							colorIndex[ i*4 + 0 ] = colorService.map_economy.indexOf(systemsService.systems[i].primary_economy);
							colorIndex[ i*4 + 1 ] = colorService.map_allegiance.indexOf(systemsService.systems[i].allegiance);
							colorIndex[ i*4 + 2 ] = colorService.map_government.indexOf(systemsService.systems[i].government);
							colorIndex[ i*4 + 3 ] = 0;

							sizes[ i ] = getPopulationScaleForSystem(system);

						}


						geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
						geometry.addAttribute( 'aColorIndex', new THREE.BufferAttribute( colorIndex, 4 ) );
						geometry.addAttribute( 'aSize', new THREE.BufferAttribute( sizes, 1 ) );
						geometry.attributes.aSize.needsUpdate = true;
						geometry.attributes.aColorIndex.needsUpdate = true;

						particleSystem = new THREE.Points( geometry, shaderMaterial );

						particleSystem.sortParticles = true;
						particleSystem.dynamic = true;
						window.scene.add(particleSystem);
						isLoading = false;
						addControls();
					}

					function getPopulationScaleForSystem(system) {
						if (system.population) {
							return 50 * Math.max(system.population / POP_SIZE_THRESHOLD, 1.0);
						}
						return BASE_POINT_SIZE;
					}

					function onMouseMove( event ) {
            var $target = $(event.target);
						mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
						mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
						if(!isLoading && c_pickingEnabled){
							var intersect = findIntersect(event);
							if (!intersect) {
										label.css({
												visibility: 'hidden',
												display: 'none'
										});
										targetCircle.visible = false;
								}
							else {
								$target.focus();
							}
						}
					}

					function addControls(){
						controls = new THREE.TrackballControls( camera, elem[0] );
						controls.rotateSpeed = 10.0;
						controls.zoomSpeed = 2.2;
						controls.panSpeed = 2;

						controls.noZoom = false;
						controls.noPan = true;

						controls.staticMoving = true;
						controls.dynamicDampingFactor = 0.3;

						controls.keys = [ 65, 83, 68 ];
						controls.minDistance = 5;
						controls.addEventListener( 'change', render );
						controls.addEventListener('end', enablePicking);
					}

					function disablePicking() {
						c_pickingEnabled = false;
					}

					function enablePicking() {
						c_pickingEnabled = true;
					}

					function addTargetCircle(){
						targetCircleGeo = new THREE.CircleGeometry(0.004, 64);
            targetCircleGeo.vertices.shift();
            targetCircle.add(new THREE.Line(targetCircleGeo, targetLineMaterial));
            targetCircle.visible = false;
            targetCircle.name = 'targetCircle';
						window.scene.add(targetCircle);
					}

					function addSelectedSystemIcon(){
						var selectedSystemIconTexture = THREE.ImageUtils.loadTexture('images/icons/map/Marker-galaxy-map-green.png');
						var selectedSystemIconMaterial = new THREE.SpriteMaterial({
							map: selectedSystemIconTexture,
							color: 0xffffff,
							transparent: true
						});
						selectedSystemIcon = new THREE.Sprite( selectedSystemIconMaterial );
						selectedSystemIcon.name = "selectedSystemIcon";
						selectedSystemIcon.visible = false;
						selectedSystemIcon.scale.set(1,1.5,1);
						window.scene.add( selectedSystemIcon );
					}

					function init() {
						camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 999000);
						camera.position.set(0, 0, 50);

						camera.lookAt(-25,0, 0);

						window.scene = new THREE.Scene();
						toggleSceneLoading(true);

						addTargetCircle();
						addSelectedSystemIcon();

						raycaster = new THREE.Raycaster();
						raycaster.params.PointCloud.threshold = 0.5;
						renderer = new THREE.WebGLRenderer();
						renderer.setSize(window.innerWidth, window.innerHeight);
						renderer.sortObjects = true;

						elem[0].appendChild(renderer.domElement);

						// Events
						window.addEventListener('resize', onWindowResize, false);
						elem[0].addEventListener('mousemove', onMouseMove, false);
						elem[0].addEventListener('mousedown', function(event) {
							c_mouseDownPos = new THREE.Vector2(event.pageX, event.pageY);
							disablePicking();
						});
						elem[0].addEventListener('mouseup', function (event) {
							if (new THREE.Vector2(event.pageX, event.pageY).distanceToSquared(c_mouseDownPos) < 1) {
								checkClickForIntersect(event);
							}
							enablePicking();
						});
					}

					function toggleSceneLoading(isLoading){
						if(isLoading){

							uniforms = {
										speed: {type: "f", value: 0.2},
										color: { type: "v3", value: new THREE.Vector3( 0.2784313725490196, 0.34509803921568627, 0.8196078431372549 ) },
										brightness: {type: "f", value: 0.4},
										radius: {type: "f", value: 0.3},
										popSize: {type: "f", value: 0.05 },
										baseSize: {type: "f", value: 0.9 },
										uvScale:{ type: "v2", value: new THREE.Vector2(1,1)},
										time: {type: "f", value: 1.0}
									};

									var shaderMaterial = new THREE.ShaderMaterial( {
										uniforms:       uniforms,
										vertexShader:   document.getElementById( 'dotVertexShader' ).textContent,
										fragmentShader: document.getElementById( 'dotFragmentShader' ).textContent
									});

									var loadingPlaneGeometry = new THREE.PlaneGeometry(50,50,50);
									loadingPlaneGeometry.lookAt( camera.position );

									loadingTextMesh = new THREE.Mesh( loadingPlaneGeometry, shaderMaterial );
									loadingTextMesh.position.set(-25,0, 0)
									window.scene.add(loadingTextMesh);
						}
						else{
							window.scene.remove(loadingTextMesh);
						}
					}

					function getLightYears(sourceVector, targetVector){
							var sourceVector = new THREE.Vector3(0,0,0);
							var targetVector = new THREE.Vector3(3.03125, -0.09375, 3.15625);

							return sourceVector.distanceTo(targetVector);
					}

					//
					function onWindowResize(event) {
						renderer.setSize(window.innerWidth, window.innerHeight);
						camera.aspect = window.innerWidth / window.innerHeight;
						camera.updateProjectionMatrix();
					}

					function checkClickForIntersect(event){
								if(!isLoading){
									var intersect = findIntersect(event);
	                if (!intersect) return;
	                var location = systemsService.systems[intersect.index];
									$rootScope.$broadcast('selectedSystem:update', location);
								}
					}

					function flyToSystem(location){
						disablePicking();
										selectedSystemIcon.position.set(location);
										stationsService.findStationsBySystemId(location.systemId);
                    var whichZ = () => {
                        return camera.position.z > 0 ? 5 : -5;
                    };
                    var tween = new TWEEN.Tween(camera.position).to({
                        x: location.x + 5,
                        y: location.y + 5,
                        z: location.z + whichZ()
                    })
										.easing(TWEEN.Easing.Linear.None)
										.onComplete(function(){
												selectedSystemIcon.visible = true;
												enablePicking();
										})
										.start();
                    var tween = new TWEEN.Tween(controls.target).to({
                        x: location.x,
                        y: location.y,
                        z: location.z
                    }).easing(TWEEN.Easing.Linear.None)
                    .start();

					}

					function setTargetPosition(location) {
              return $q(function (resolve, reject) {
                  targetCircle.visible = true;
									targetCircle.lookAt( camera.position );
									var popScale = getPopulationScaleForSystem( location );
									targetCircle.scale.set( popScale, popScale, popScale );
                  return resolve(targetCircle.position.set(location.x, location.y, location.z))
              }.bind(this));
          }


					function findIntersect(event) {
							raycaster.setFromCamera(mouse, camera);
							var intersects = raycaster.intersectObjects(window.scene.children);
							if (Array.isArray(intersects) && intersects[0]) {
									var intersect = intersects[0];
									if(intersect.object.name === 'selectedSystemIcon'){
										if(intersects[1]){
											intersect = intersects[1];
										}
										else{
											return false;
										}
									}
									else{
										var location = systemsService.systems[intersect.index];
										if (!colorService.isSystemActive(location))
											return false;
										addLabel(event, location.name);
										setTargetPosition(location);
										return intersect;
									}
							} else {
									return false;
							}
					}

					function addLabel(event, name){
              return $q(function (resolve, reject) {
                  label.css({
                      top: (event.offsetY - 1) - 30,
                      left: (event.offsetX + 1) - 40,
                      visibility: 'visible',
                      display: 'block'
                  });
                  return resolve(label.html(name));
              }.bind(this));
					}

					function animate(time) {
						if(!isLoading){
							controls.update();
							selectedSystemIcon.position.copy( camera.position );
							selectedSystemIcon.rotation.copy( camera.rotation );
							selectedSystemIcon.updateMatrix();
							selectedSystemIcon.translateZ( - 30 );
							selectedSystemIcon.translateY( + 0.7 );
						}
						requestAnimationFrame(animate);
						TWEEN.update(time);
						render();
					}

					//
					function render() {
						var delta = clock.getDelta();
						if(isLoading){
							uniforms.time.value += delta * 5;
						}
						renderer.autoClear = false;
						renderer.clear();
						// renderer.render(backgroundScene , backgroundCamera )
						renderer.render(window.scene, camera);
					}
				}
			}
		}
	);
