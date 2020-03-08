/**
 * @copyright Itential, LLC 2015
 *
 * host_status.js
 *
 * Show relevant process and system data and show module details and actions
 */
/* eslint-disable no-console */

/////////////////////////////////////////////////////////////////

var urlPrefix = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port;
var pollFrequency = 1000; // ms
var attemptTimeoutTime = 5000; // ms - time to wait for a module to load before giving up and letting the user try again
var maxLineChartLength = 5 * 60 * 1000; // ms

var microInMilli = 1000;
var microsecondsPerPoll = pollFrequency * microInMilli;

var loadAvgWarningThreshold = .7;

var alertColor = '#f44336';
var warningColor = '#ffa500';
var normalBarColor = '#E6E6E6';

var api = {
	getSystemHealthData: function() {
		return utilities.http('GET', urlPrefix + '/health/system');
	},

	getModulesHealthData: function() {
		return utilities.http('GET', urlPrefix + '/health/modules');
	},

	getServerHealthData: function() {
		return utilities.http('GET', urlPrefix + '/health/server');
	},

	getModuleDetails: function(moduleId) {
		return utilities.http('GET', urlPrefix + '/health/module/' + moduleId);
	},

	stopModule: function(moduleId) {
		return utilities.http('GET', urlPrefix + '/modules/stop/' + moduleId);
	},

	startModule: function(moduleId) {
		return utilities.http('GET', urlPrefix + '/modules/start/' + moduleId);
	},
	restartModule: function(moduleId) {
		return utilities.http('GET', urlPrefix + '/modules/restart/' + moduleId);
	},
	getAdapterData: function(moduleId) {
		return utilities.http('GET', urlPrefix + '/providers/' + moduleId);
	}
};

/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////

app.config(['$compileProvider', function($compileProvider) {
	// Tell Angular to whitelist data urls for now, because by default Angular
	// will set unsafe: to the version object download as a measure to prevent
	// XSS attacks
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(data):/);
}]);

app.controller('HostStatus', ['$scope', '$interval', '$timeout', function($scope, $interval, $timeout) {
	$scope.appCols = [
		{ display: 'Status', eleName: 'status', sorter: true, filter: false },
		{ display: 'Name', eleName: 'name', sorter: true, filter: true },
		{ display: 'Version', eleName: 'version', sorter: true, filter: true },
		{ display: 'PID', eleName: 'pid', sorter: true, filter: true },
		{ display: 'Memory', eleName: 'memory', sorter: true, filter: false },
		{ display: 'CPU', eleName: 'displayCpu', sorter: true, filter: false },
		{ display: 'Uptime', eleName: 'uptime', sorter: true, filter: false },
		{ display: 'Actions', sorter: false, filter: false }
	];

	$scope.adapterCols = [
		{ display: 'Status', eleName: 'status', sorter: false, filter: false  },
		{ display: 'Connection', eleName: 'connStatus', sorter: false, filter: false  },
		{ display: 'Name', eleName: 'name', sorter: true, filter: true },
		{ display: 'Type', eleName: 'adapter', sorter: true, filter: true },
		{ display: 'Version', eleName: 'version', sorter: true, filter: true },
		{ display: 'PID', eleName: 'pid', sorter: true, filter: true },
		{ display: 'Memory', eleName: 'memory', sorter: true, filter: false },
		{ display: 'CPU', eleName: 'displayCpu', sorter: true, filter: false },
		{ display: 'Uptime', eleName: 'uptime', sorter: true, filter: false },
		{ display: 'Actions', sorter: false, filter: false }
	];

	$scope.modules = [];
	$scope.core = {};
	$scope.system = {};
	$scope.charts = {};
	$scope.secondPoll = false;

	$scope.startAllProcessing = { // if a "Start All" button was clicked recently
		Adapter: false,
		Application: false
	};

	$scope.sorters = {
		apps: {
			col: 'name',
			direction: 'descending'
		},
		adapters: {
			col: 'name',
			direction: 'descending'
		}
	};

	$scope.filters = {
		apps: { type: 'Application' }, // populated with keys being eleNames from above
		adapters: { type: 'Adapter' }
	};

	for (var i = 0; i < $scope.appColslength; i++) {
		if ($scope.appCols[i].filter) {
			$scope.filters.apps[$scope.appCols[i].eleName] = '';
		}
	}

	for (i = 0; i < $scope.adapterCols.length; i++) {
		if ($scope.adapterCols[i].filter) {
			$scope.filters.adapters[$scope.adapterCols[i].eleName] = '';
		}
	}

	ProngPromise.all([
		api.getSystemHealthData().then(function(systemHealthData) {
			var initialCpuTotals = getOsCpuData(systemHealthData.cpus, null);
			var cumTotal = initialCpuTotals.userCum + initialCpuTotals.systemCum + initialCpuTotals.idleCum;

			$scope.system = {
				osVersion: systemHealthData.release,
				cpuModel: systemHealthData.cpus[0].model,
				uptime: systemHealthData.uptime,
				currCpuData: initialCpuTotals,
				prevCpuData: null,
				loadAvgs: systemHealthData.loadavg,
				numCores: systemHealthData.cpus.length,
				cpuAlloc: {
					totalMem: initialCpuTotals.idleCum / cumTotal,
					totalUsed: (initialCpuTotals.userCum + initialCpuTotals.systemCum) / cumTotal
				},
				memoryAlloc: {
					total: systemHealthData.totalmem,
					totalUsed: systemHealthData.totalmem - systemHealthData.freemem,
					free: systemHealthData.freemem
				}
			};
		}),

		api.getServerHealthData().then(function(serverHealthData) {
			$scope.core = {
				// for display
				nodeVersion: serverHealthData.versions.node,
				v8Version: serverHealthData.versions.v8,
				pronghornVersion: serverHealthData.release,
				uptime: serverHealthData.uptime,
				memory: serverHealthData.memoryUsage.rss,
				status: !!serverHealthData.cpuUsage,
				displayCpu: null,
				pid: serverHealthData.pid,

				// for internal use
				currCpuData: getProcessCpuData(serverHealthData.cpuUsage, null),
				prevCpuData: null
			};
		}),

		api.getModulesHealthData().then(function(modulesHealthData) {
			$scope.modules = modulesHealthData.map(function(moduleHealthDatum) {
				return {
					// for display
					type: moduleHealthDatum.type,
					packageId: moduleHealthDatum.package_id,
					status: moduleHealthDatum.state === 'RUNNING',
					connStatus: moduleHealthDatum.connection && moduleHealthDatum.connection.state === 'ONLINE',
					name: moduleHealthDatum.id || 'N/A',
					version: (moduleHealthDatum.version === 'unknown' ? '' : moduleHealthDatum.version),
					memory:  moduleHealthDatum.memoryUsage.rss,
					displayCpu: null,
					uptime: moduleHealthDatum.uptime,
					pid: moduleHealthDatum.pid,
					hideActions: !moduleHealthDatum.package_id || moduleHealthDatum.package_id.indexOf('adapter-redis') !== -1,
					externalVersion: inferExternalVersion(moduleHealthDatum),
					// for internal use
					prevCpuData: null,
					currCpuData: getProcessCpuData(moduleHealthDatum.cpuUsage, null),
					isProcessing: false
				};
			});
		}),


	]).then( function(results) {
		// Get adapter type if module is an adapter
		$scope.modules.forEach( function (module) {
			if (module.name && module.type === "Adapter") {
				api.getAdapterData(module.name).then( function (adapterData) {
					if (adapterData && adapterData.type) module.adapter = adapterData.type;
				});
			}
		});
		$scope.charts.moduleCpu = drawPieChart([0], [''], 'moduleCpuChart', 'Loading...', '');
		delete $scope.filters.adapters.pid;

		$scope.system.memoryAlloc.pronghornUsed = $scope.core.memory +
			$scope.modules.reduce(function(a, b) {
				return (a.memory || a) + (b.memory || 0);
			});

		$scope.system.memoryAlloc.otherUsed = $scope.system.memoryAlloc.totalUsed -
												$scope.system.memoryAlloc.pronghornUsed;

		var systemMemChartData = [
			$scope.system.memoryAlloc.pronghornUsed,
			$scope.system.memoryAlloc.otherUsed,
			$scope.system.memoryAlloc.free
		];

		var sytemMemChartLabels = ['Pronghorn Used', 'Other Used', 'Free'];
		var loadAvgsChartLabels = ['1 Min', '5 Min', '15 Min'];

		$scope.charts = {
			systemMem: drawLineChart(systemMemChartData, sytemMemChartLabels, $scope.system.memoryAlloc.total, 'systemMemChart', 'bytes'),
			loadAvgs: drawBarChart($scope.system.loadAvgs, loadAvgsChartLabels, $scope.system.numCores, 'loadAvgsChart', 'number')
		};
	})
	.catch($scope.handleCoreDeath);

	$interval(function() {
		if (!$scope.core.status) {
			// Cycle nothing as time is still passing
			for (var i = 0; i < 3; i++) {
				$scope.charts.systemMem.data.datasets[i].data.shift();
				$scope.charts.systemCpu.data.datasets[i].data.shift();
				$scope.charts.systemMem.data.datasets[i].data.push(0);
				$scope.charts.systemCpu.data.datasets[i].data.push(0);
			}

			$scope.updateAllCharts();

			// Then skip actually trying to poll
			return;
		}

		$scope.secondPoll = true;

		ProngPromise.all([
			api.getSystemHealthData().then(function(systemHealthData) {
				$scope.system.prevCpuData = $scope.system.currCpuData;
				$scope.system.currCpuData = getOsCpuData(systemHealthData.cpus, $scope.system.prevCpuData);
				$scope.system.cpuAlloc.idle = $scope.system.currCpuData.idleDiffRelative;
				$scope.system.cpuAlloc.totalUsed = 1 - $scope.system.cpuAlloc.idle;
				$scope.system.memoryAlloc.free = systemHealthData.freemem;
				$scope.system.memoryAlloc.totalUsed = systemHealthData.totalmem - systemHealthData.freemem;
				$scope.system.uptime = systemHealthData.uptime, 'seconds';
				$scope.system.loadAvgs = systemHealthData.loadavg;
			}),

			api.getServerHealthData().then(function(serverHealthData) {
				$scope.core.uptime = serverHealthData.uptime;
				$scope.core.memory = serverHealthData.memoryUsage.rss;
				$scope.core.status = !!serverHealthData.cpuUsage;
				$scope.core.prevCpuData = $scope.core.currCpuData;
				$scope.core.currCpuData = getProcessCpuData(serverHealthData.cpuUsage, $scope.core.prevCpuData);
				$scope.core.displayCpu = $scope.core.currCpuData.totalDiff / microsecondsPerPoll;
				$scope.core.pid = serverHealthData.pid;
			}),

			api.getModulesHealthData().then(function(modulesHealthData) {
				for (var i = 0; i < modulesHealthData.length; i++) {
					var moduleHealthDatum = modulesHealthData[i];

					if (!moduleHealthDatum) continue; // moduleHealthDatum might be null...

					// var existingModule = $scope.modules.find(function(module) {
					// 	return module.name === moduleHealthDatum.id;
					// });

					var existingModule = null;
					for (var m=0; m<$scope.modules.length;m++) {
						var mod = $scope.modules[m];
						if (mod.name === moduleHealthDatum.id) {
							existingModule = mod;
							break;
						}
					}

					if (!existingModule) continue;

					existingModule.status = moduleHealthDatum.state === 'RUNNING';
					existingModule.memory = moduleHealthDatum.memoryUsage.rss;
					existingModule.uptime = moduleHealthDatum.uptime;
					existingModule.connStatus = moduleHealthDatum.connection && moduleHealthDatum.connection.state === 'ONLINE';
					existingModule.pid = moduleHealthDatum.pid;

					if (existingModule.status) {
						existingModule.prevCpuData = existingModule.currCpuData;
						existingModule.currCpuData = getProcessCpuData(moduleHealthDatum.cpuUsage, existingModule.prevCpuData);
						existingModule.displayCpu = existingModule.currCpuData.totalDiff / microsecondsPerPoll;

						if (existingModule.displayCpu < 0) {
							existingModule.displayCpu = null;
						}
					} else {
						existingModule.displayCpu = null;
					}
				}
			})
		])
		.then(function(results) {
			// calcing sums to get comparisons between modules and system
			$scope.system.memoryAlloc.pronghornUsed =
				$scope.core.memory + $scope.modules.reduce(function(a, b) {
					return (a.memory || a) + (b.memory || 0);
				});

			// Convert micro to milli and compare to the total diff for system cpu in order to compare
			// to system level data (note the diff isn't necessarily the same as poll interval)
			$scope.system.cpuAlloc.pronghornUsed = ( $scope.core.currCpuData.totalDiff + $scope.modules.reduce(function(a, b) {
				return (a && a.status ? a.currCpuData.totalDiff : 0) + (b && b.status ? b.currCpuData.totalDiff : 0);
			})) / microInMilli / $scope.system.currCpuData.totalDiff;

			$scope.system.cpuAlloc.otherUsed = $scope.system.cpuAlloc.totalUsed - $scope.system.cpuAlloc.pronghornUsed;
			$scope.system.memoryAlloc.otherUsed = $scope.system.memoryAlloc.totalUsed - $scope.system.memoryAlloc.pronghornUsed;

			var moduleCpuChartData = $scope.modules.map(function(module) {
				return module.displayCpu;
			});

			// Core always comes first in the chart data
			moduleCpuChartData.unshift($scope.core.displayCpu);

			// cpu chart always generated on second poll (because first was just preparing for diff
			if (!$scope.charts.moduleCpu && !$scope.charts.systemCpu) {
				var moduleCpuChartLabels = $scope.modules.map(function(module) {
					return module.name;
				});

				// Core always comes first in the chart data
				moduleCpuChartLabels.unshift('Core');

				var systemCpuChartLabels = ['Pronghorn Used', 'Other Used', 'Idle'];
				var systemCpuChartData = [
					$scope.system.cpuAlloc.pronghornUsed,
					$scope.system.cpuAlloc.otherUsed,
					$scope.system.cpuAlloc.idle
				];

				$scope.charts.systemCpu = drawLineChart(systemCpuChartData, systemCpuChartLabels, 1, 'systemCpuChart', 'percent');
				$scope.charts.moduleCpu = drawPieChart(moduleCpuChartData, moduleCpuChartLabels, 'moduleCpuChart', 'Module CPU', 'percent');
			} else {
				// update data in module cpu doughnut
				$scope.charts.moduleCpu.data.datasets[0].data = moduleCpuChartData;

				// In case it was 'pronghorn down', switch it back:
				$scope.charts.moduleCpu.title = 'Module CPU';

				$scope.charts.systemCpu.data.datasets[0].data.push($scope.system.cpuAlloc.pronghornUsed > 0 ? $scope.system.cpuAlloc.pronghornUsed : 0);
				$scope.charts.systemCpu.data.datasets[1].data.push($scope.system.cpuAlloc.otherUsed > 0 ? $scope.system.cpuAlloc.otherUsed : 0);
				$scope.charts.systemCpu.data.datasets[2].data.push($scope.system.cpuAlloc.idle > 0 ? $scope.system.cpuAlloc.idle : 0);

			}

			// push to new data to systemMem chart
			$scope.charts.systemMem.data.datasets[0].data.push($scope.system.memoryAlloc.pronghornUsed > 0 ? $scope.system.memoryAlloc.pronghornUsed : 0);
			$scope.charts.systemMem.data.datasets[1].data.push($scope.system.memoryAlloc.otherUsed > 0 ? $scope.system.memoryAlloc.otherUsed : 0);
			$scope.charts.systemMem.data.datasets[2].data.push($scope.system.memoryAlloc.free > 0 ? $scope.system.memoryAlloc.free : 0);

			// clean up from left side
			for (var i = 0; i < 3; i++) {
				$scope.charts.systemMem.data.datasets[i].data.shift();
				$scope.charts.systemCpu.data.datasets[i].data.shift();
			}

			// If the load average is too high make it red
			$scope.charts.loadAvgs.data.datasets[0].backgroundColor = $scope.system.loadAvgs.map(function(loadAvg) {
				if (loadAvg > $scope.system.numCores) {
					return alertColor;
				} else if (loadAvg > (loadAvgWarningThreshold * $scope.system.numCores)) {
					return warningColor;
				}
				return normalBarColor;
			});

			// update load averages chart
			$scope.charts.loadAvgs.data.datasets[0].data = $scope.system.loadAvgs;

			// update all
			$scope.updateAllCharts();
		})
		.catch($scope.handleCoreDeath);
	}, pollFrequency);

	/////////////////////////////////////////////////////////////////
	// BUTTON ACTIONS

	$scope.setSorter = function(type, colName, canSort) {
		if (!canSort) return;

		if ($scope.sorters[type].col === colName) {
			if ($scope.sorters[type].direction === 'ascending') {
				$scope.sorters[type].direction = 'descending';
			} else {
				$scope.sorters[type].direction = 'ascending';
			}
		} else {
			$scope.sorters[type].col = colName;
			$scope.sorters[type].direction = 'descending';
		}
	};

	$scope.moduleHealth = function(app) {
		location.href = "/module_status/" + app;
	};

	$scope.startModule = function(module) {
		module.isProcessing = true;

		api.startModule(module.name);

		$timeout(function() {
			module.isProcessing = false;
		}, attemptTimeoutTime);
	};

	$scope.stopModule = function(module) {
		module.isProcessing = true;

		api.stopModule(module.name);

		$timeout(function() {
			module.isProcessing = false;
		}, attemptTimeoutTime);
	};

	$scope.stopProp = function(event) {
		event.stopPropagation();
	};

	$scope.restartModule = function(module) {
		module.isProcessing = true;

		api.restartModule(module.name);

		$timeout(function() {
			module.isProcessing = false;
		}, attemptTimeoutTime);

	};

	$scope.clearFilter = function(type, eleName) {
		delete $scope.filters[type][eleName];
	};

	$scope.attemptRestart = function() {
		$scope.core.status = true;
		$scope.charts.moduleCpu.update();
	};

	$scope.allRunning = function(type) {
		return !$scope.modules.filter(function(module) {
			return module.type === type && !module.status;
		}).length;
	};

	$scope.generateBlueprint = function() {
		var blueprintName = 'Autogenerated Pronghorn blueprint on ' + new Date().toISOString();
		var blueprint = {
			name: blueprintName,
			description: 'Autogenerated blueprint from a running Pronghorn instance',
			version: '0',
			environment: {
				os: {
					version: $scope.system.osVersion
				},
				node: {
					version: $scope.core.nodeVersion
				}
			},
			external: [],
			packages: {}
		};
    // get core's version & add to packages obj
    blueprint.packages['@itential/pronghorn-core'] = $scope.core.pronghornVersion;
    // get other packages' version & add to packages obj
		$scope.modules.forEach(function(module) {
			blueprint.packages[module.packageId] = module.version;

			// Generate external system data for some adapters
			if (module.type === 'Adapter') {
				switch (module.packageId) {
					case '@itential/adapter-mongo':
						blueprint.external.push({
							name: module.name,
							type: 'mongo'
						});
						break;
					case '@itential/adapter-redis':
						blueprint.external.push({
							name: module.name,
							type: 'redis'
						});
						break;
					case '@itential/adapter-nso':
						blueprint.external.push({
							name: module.name,
							type: 'nso',
							version: module.externalVersion
						});
						break;
					case '@itential/adapter-prospector':
						blueprint.external.push({
							name: module.name,
							type: 'prospector'
						});
						break;
					// additional external system cases or more details for each system may be added
				}
			}
		});

		var versionBlob = new Blob ([JSON.stringify(blueprint, null, '\t')], {type: 'text/json'} );

		if (window.navigator.msSaveBlob) {
            window.navigator.msSaveBlob(versionBlob, blueprintName + '.json');
        } else {
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            url = window.URL.createObjectURL(versionBlob);
            a.href = url;
            a.download = blueprintName + '.json';
            a.click();
            window.URL.revokeObjectURL(url);
        }
	};

	/////////////////////////////////////////////////////////////////
	// Scoped helpers

	$scope.handleCoreDeath = function(error) {

		$scope.core.status = false;

		delete $scope.charts.loadAvgs.data.datasets[0].data;
		$scope.charts.moduleCpu.data.datasets[0].data = new Array(26);

		$scope.charts.moduleCpu.title = 'Pronghorn down.';

		$scope.updateAllCharts();

		for (var i = 0; i < $scope.modules.length; i++) {
			var mod = $scope.modules[i];

			delete mod.displayCpu;
			delete mod.memory;
			delete mod.pid;
			delete mod.uptime;
			mod.status = false;
			mod.connStatus = false;
		}

		delete $scope.core.pid;
		delete $scope.core.uptime;
		delete $scope.core.displayCpu;
		delete $scope.core.memory;

		delete $scope.system.displayCpu;
		delete $scope.system.memory;
		delete $scope.system.memoryAlloc.pronghornUsed;
		delete $scope.system.cpuAlloc.pronghornUsed;
	};

	$scope.updateAllCharts = function() {
		for (var k in $scope.charts) {
			$scope.charts[k].update();
		}
	};

	$scope.allRunning = function(type) {
		return !$scope.modules.filter(function(module) {
			return module.type === type && !module.status;
		}).length;
	};

	/////////////////////////////////////////////////////////////////

	// Make prettifiers accessible to the view via scope
	$scope.bytesToPrettyMem = bytesToPrettyMem;
	$scope.prettyCpuDetails = prettyCpuDetails;
	$scope.secondsToPrettyDate = secondsToPrettyDate;
	$scope.amountToPrettyPercentage = amountToPrettyPercentage;
}]);


///////HELPERS/////////

//newCpus is list of cpus with time since boot
//Pass oldCpuTotals as the result of the last time the function is called to get a diff.
//Pass oldCpuTotals as null to only get cum since boot and no diffs
function getOsCpuData(newCpus, oldCpuTotals) {
	var retVal = {
		userDiffRelative: null,
		systemDiffRelative: null,
		idleDiffRelative: null,
		userDiffAbsolute: null,
		systemDiffAbsolute: null,
		idleDiffAbsolute: null,
		totalDiff: null,
		userCum: 0,
		systemCum: 0,
		idleCum: 0
	};

	for (var i = 0; i < newCpus.length; i++) {
		retVal.userCum += newCpus[i].times.user;
		retVal.systemCum += newCpus[i].times.sys;
		retVal.idleCum += newCpus[i].times.idle;
	}

	if (oldCpuTotals) {
		retVal.userDiffAbsolute = retVal.userCum - oldCpuTotals.userCum;
		retVal.systemDiffAbsolute = retVal.systemCum - oldCpuTotals.systemCum;
		retVal.idleDiffAbsolute = retVal.idleCum - oldCpuTotals.idleCum;
		retVal.totalDiff = retVal.userDiffAbsolute + retVal.systemDiffAbsolute + retVal.idleDiffAbsolute;

		retVal.userDiffRelative = retVal.userDiffAbsolute / retVal.totalDiff;
		retVal.systemDiffRelative = retVal.systemDiffAbsolute / retVal.totalDiff;
		retVal.idleDiffRelative = retVal.idleDiffAbsolute / retVal.totalDiff;

	}

	return retVal;
}

// Given a module object from health call, if the module is an adapter,
// attempt to find the version of the external system (this could be specific to
// the adapter type)
function inferExternalVersion(moduleHealthObj) {
	if (moduleHealthObj.package_id === '@itential/adapter-nso') {
		try {
			var versions = moduleHealthObj.connection.version;
			var versionObj = versions.find(function(version) {
				return version.hasOwnProperty('NSO');
			});
			return versionObj.NSO;
		} catch(err) {
			return null;
		}
	}

	return null;
}

// if oldProcessCpuTotals is null assume no comparison i.e. the result is only cum since boot
function getProcessCpuData(newProcessCpuUsage, oldProcessCpuUsage) {
	return {
		totalDiff: (oldProcessCpuUsage
					? (newProcessCpuUsage.user + newProcessCpuUsage.system - oldProcessCpuUsage.totalCum)
					: null),

		totalCum: newProcessCpuUsage.user + newProcessCpuUsage.system
	};
}

var bytesToPrettyMem = function(bytes) {
		if (bytes === 0) return 0;
		if (bytes < 1) return bytes + 'B';

		var exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1000)), 9);
		var numStr = Number((bytes / Math.pow(1000, exponent)).toPrecision(3));
		var unit = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'][exponent];

		return numStr + unit;
	};

// makes the trademark and the registered symbols
var prettyCpuDetails = function(details) {
	var tmIndex = details.indexOf('(TM)');
	var regIndex = details.indexOf('(R)');

	if (tmIndex !== -1) {
		details.slice(tmIndex, tmIndex + 3);
		details = details.substr(0, tmIndex) + '™' + details.substr(tmIndex + 4);
	}

	if (regIndex !== -1) {
		details.slice(regIndex, tmIndex + 3);
		details = details.substr(0, regIndex) + '®' + details.substr(regIndex + 3);
	}

	return details;
};

// type should be microseconds, milliseconds, or seconds
var secondsToPrettyDate = function(seconds, type) {
	if (!seconds) return '';

	if (type === 'seconds') {
    return [
      parseInt(seconds / 60 / 60),
      parseInt(seconds / 60 % 60),
      parseInt(seconds % 60)
    ]
      .join(":")
      .replace(/\b(\d)\b/g, "0$1");

	} else if (type === 'microseconds'){
		if (seconds < 1000) {
			return seconds + 'μs';
		} else if (seconds < 1000000) {
			return Math.round(seconds / 10) / 100 + 'ms';
		}
		return Math.round(seconds / 10000) / 100 + 's';
	}

	throw new Error('seconds type not recognized');
};

var amountToPrettyPercentage = function(amount) {
	return (amount * 100).toFixed(1) + '%';
};

// data unit is string of butes, percent, microseconds, etc
function applyDataUnit(value, dataUnits) {
	switch (dataUnits) {
		case 'bytes':
			return bytesToPrettyMem(value);
		case 'percent':
			return amountToPrettyPercentage(value);
		case 'microseconds':
		case 'number':
			return value.toFixed(2);
		case 'milliseconds':
			return secondsToPrettyDate(value, dataUnits);
		default:
			return value;
    }
}

/**
 * @param  {object
 * @param  {id in DOM}
 * @param  {string}
 * @param  {string}
 * @param  {string}
 * @param  {string of [bytes, percent, microseconds] etc}
 * @param  {Boolean}
 *
 * @returns the chart object so it can be manipulated later
 */
function drawPieChart(initValues, labels, canvasId, title, dataUnits) {
	var ctx = document.getElementById(canvasId).getContext("2d");

	var colors = initValues.map(function(v, i) {
		return nextColorHex(i);
	});

	var newChart = new Chart(ctx, {
		type: 'pie',
		data: {
			labels: labels,
			datasets: [{
				data: initValues,
				backgroundColor: colors
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: true,
			cutoutPercentage: 70,
			legend: { display: false },
			tooltips: {
				callbacks: {
					// this is what gets shown on hover - prettify the value depending on dataUnits
					label: function(tooltipItem, data) {
						var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
						var name = data.labels[tooltipItem.index];
						return name + ': ' + applyDataUnit(value, dataUnits);
					}
				}
			}
		}
	});

	newChart.title = title;

	return newChart;
}

function drawLineChart(initValues, labels, maxY, canvasId, dataUnits) {
	// this is num in x axis
	var xAxisLabels = new Array(maxLineChartLength / pollFrequency);

	var colors = ['#0094D9', '#595959', 'rgba(192, 192, 192, .2)'];

	var data = initValues.map(function(value, i) {
		return {
			label: labels[i],
            fill: true,
            lineTension: 0,
            backgroundColor: colors[i],
            borderColor: colors[i],
            borderWidth: 0,
            borderJoinStyle: 'round', // careful here - could cause weird rendering glitches in animation
			borderCapStyle: 'round',
			pointHoverBackgroundColor: colors[i],
			pointHoverBorderColor: "rgba(220,220,220,1)",
			pointHoverBorderWidth: 2,
			pointRadius: 0,
			pointHitRadius: 10,
			steppedLine: true,
			data: new Array((maxLineChartLength / pollFrequency)).concat([value]),
			spanGaps: false
		};
	});

	var ctx = document.getElementById(canvasId).getContext("2d");

	var newChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: xAxisLabels,
			datasets: data
		},
		options: {
			legend: { display: false }, // no legend
			scales: {
				yAxes: [{
					stacked: true,
					ticks: {
						max: maxY,
						callback: function(label) {
							if (maxY === label && dataUnits === 'bytes') {
								return '';
							}

							return applyDataUnit(label, dataUnits);
						}
					}
				}]
			},
			tooltips: {
				callbacks: {
					// this is what gets shown on hover - prettify the value depending on dataUnits
					label: function(tooltipItem, data) {
						var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
						var name = data.datasets[tooltipItem.datasetIndex].label;
						return name + ': ' + applyDataUnit(value, dataUnits);
					}
				}
			}
		}
	});

	return newChart;
}

function drawBarChart(initValues, labels, numCores, canvasId, dataUnits) {
	var ctx = document.getElementById(canvasId).getContext("2d");

	var originalLineDraw = Chart.controllers.horizontalBar.prototype.draw;

	// Redline draw
	Chart.helpers.extend(Chart.controllers.horizontalBar.prototype, {
		draw: function() {
			originalLineDraw.apply(this, arguments);

			var chart = this.chart;
			var ctx = chart.chart.ctx;

			var xaxis = chart.scales['x-axis-0'];
			var yaxis = chart.scales['y-axis-0'];
			var y1 = yaxis.top;
			var y2 = yaxis.bottom;
			var x1;
			var x2;

			// draw redline
			if (chart.config.options.alertLine) {
				x1 = xaxis.getPixelForValue(chart.config.options.alertLine);
				x2 = xaxis.getPixelForValue(chart.config.options.alertLine);

				ctx.save();
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.strokeStyle = alertColor;
				ctx.lineTo(x2, y2);
				ctx.stroke();

				ctx.restore();
			}

			////////

			// draw yellowline
			if (chart.config.options.warningLine) {

				x1 = xaxis.getPixelForValue(chart.config.options.warningLine);

				x2 = xaxis.getPixelForValue(chart.config.options.warningLine);

				ctx.save();
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.strokeStyle = warningColor;
				ctx.lineTo(x2, y2);
				ctx.stroke();

				ctx.restore();
			}
		}
	});

	var newChart = new Chart(ctx, {
		type: 'horizontalBar',
		data: {
			labels: labels,
			datasets: [{
				borderWidth: 1,
				data: initValues,
                backgroundColor: [normalBarColor, normalBarColor, normalBarColor]
			}]
		},
		options: {
			alertLine: numCores,
			warningLine: numCores * loadAvgWarningThreshold,
			legend: { display: false },
			scales: {
				xAxes: [{
					ticks: {
						min: 0,
						max: numCores * 2
					},
					scaleLabel: {
						display: true,
						labelString: 'Virtual Cores'
					}
				}]
			},
			tooltips: {
				callbacks: {
					// this is what gets shown on hover - prettify the value depending on dataUnits
					label: function(tooltipItem, data) {
						var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
						var name = data.labels[tooltipItem.index];
						return applyDataUnit(value, dataUnits);
					}
				}
			}
		}
	});

	return newChart;
}

// change the hexes - should be more primary colors at first and then
// gradually use less common colors further down the array function
function nextColorHex(count) {
	return ['#0094D9', 			'#4bb173',          '#e25512',          '#2ebcb1',
			'#f4873f',          '#93c750',          '#d0699d',          '#9b2ffa',
			'#bd5b71',          '#cbdd22',          '#93bfc4',          '#53b92d',
			'#4d9a3d',          '#e8d961',          '#b7800d',          '#8af5ed',
			'#b4f764',          '#0720c3',          '#4d2036',          '#303100',
			'#a18d2c',          '#dfdfdf',          '#f8970c',          '#3e4143',
			'#84194b',          '#00456e',          '#00507f',          '#005689',
			'#c5959f',          '#242367',          '#204566',          '#193996',
			'#181470',          '#163387',          '#157991',          '#141834',
			'#120331',          '#81daf5',          '#51173a',          '#4b392f',
			'#fac09d',          '#f9ae82',          '#585858',          '#818181',
			'#5f7d8c',          '#8f775a',          '#6c7567',          '#98884b',
			'#2a324b',          '#525c44',          '#856d61',          '#78715f',
			'#332524',          '#c3b7a7',          '#a89287',          '#4e3c3a',
			'#f9f9f9',          '#f18914',          '#060606',          '#455040',
			'#aec9a2',          '#f6546a'][count];
}





Array.prototype.pluck = function(key) {
  return this.map(function(object) { return object[key]; });
};

Chart.pluginService.register({
	beforeDraw: function(chart) {
		if (!chart.title) return;

		var width = chart.chart.width,
			height = chart.chart.height,
			ctx = chart.chart.ctx;

		ctx.restore();
		var fontSize = (height / 150).toFixed(2);
		ctx.font = fontSize + "em sans-serif";
		ctx.textBaseline = "middle";

		var text = chart.title,
			textX = Math.round((width - ctx.measureText(text).width) / 2),
			textY = height / 2;

		ctx.fillText(text, textX, textY);
		ctx.save();
	}
});