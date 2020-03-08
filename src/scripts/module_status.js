/**
 * @copyright Itential, LLC 2015
 *
 * module_status.js
 *
 * Allow per-module logging levels
 */
/* eslint-disable no-console */

/////////////////////////////////////////////////////////////////

var utilities = new PronghornUtils();
var urlPrefix = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port;

var pollFrequency = 1000; // ms
var attemptTimeoutTime = 5000; // ms - time to wait for a module to load before giving up and letting the user try again
var maxLineChartLength = 5 * 60 * 1000; // ms

var microInMilli = 1000;
var microsecondsPerPoll = pollFrequency * microInMilli;

var moduleId = decodeURIComponent(window.location.pathname.split("/")[2]);

var alertColor = '#f44336';
var warningColor = '#ffa500';
var normalBarColor = '#E6E6E6';

var api = {

	getModuleHealthData: function() {
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
	}
};

var closePage = function() {
	location.href = "/host_status";
};

// if oldProcessCpuTotals is null assume no comparison i.e. the result is only cum since boot
function getProcessCpuData(newProcessCpuUsage, oldProcessCpuUsage) {
	return {
		totalDiff: (oldProcessCpuUsage
					? (newProcessCpuUsage.user + newProcessCpuUsage.system - oldProcessCpuUsage.totalCum)
					: null),

		totalCum: newProcessCpuUsage.user + newProcessCpuUsage.system
	};
}



app.config(['$compileProvider', function($compileProvider) {
	// Tell Angular to whitelist data urls for now, because by default Angular
	// will set unsafe: to the version object download as a measure to prevent
	// XSS attacks
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(data):/);
}]);

app.controller('ModuleStatus', ['$scope', '$interval', '$timeout', function($scope, $interval, $timeout) {

	$scope.adapterCols = [
		{ display: 'Status', eleName: 'status', sorter: false, filter: false  },
		{ display: 'Connection', eleName: 'connStatus', sorter: false, filter: false  },
		{ display: 'Name', eleName: 'name', sorter: true, filter: true },
		{ display: 'Version', eleName: 'version', sorter: true, filter: true },
		{ display: 'PID', eleName: 'pid', sorter: true, filter: true },
		{ display: 'Memory', eleName: 'memory', sorter: true, filter: false },
		{ display: 'CPU', eleName: 'displayCpu', sorter: true, filter: false },
		{ display: 'Uptime', eleName: 'uptime', sorter: true, filter: false },
		{ display: 'Actions', sorter: false, filter: false }
	];

	$scope.appCols = [
		{ display: 'Status', eleName: 'status', sorter: false, filter: false  },
		{ display: 'Name', eleName: 'name', sorter: true, filter: true },
		{ display: 'Version', eleName: 'version', sorter: true, filter: true },
		{ display: 'PID', eleName: 'pid', sorter: true, filter: true },
		{ display: 'Memory', eleName: 'memory', sorter: true, filter: false },
		{ display: 'CPU', eleName: 'displayCpu', sorter: true, filter: false },
		{ display: 'Uptime', eleName: 'uptime', sorter: true, filter: false },
		{ display: 'Actions', sorter: false, filter: false }
	];

	var currCpuData = null;
	var prevCpuData = currCpuData;
	api.getModuleHealthData().then(function(data) {
		$scope.id = data.id;
		$scope.uptime = data.uptime;
		$scope.state = data.state !== "STOPPED";
		$scope.pid = data.pid;
		$scope.type = data.type;
		$scope.version = data.version;
		$scope.package_id = data.package_id;
		$scope.console_level = data.logger;
		$scope.application = moduleId;
		$scope.isProcessing = false;
		$scope.console_level = data.logger.console;
		$scope.file_level = data.logger.file;
		$scope.syslog_level = data.logger.syslog;
		$scope.type = data.type;
		$scope.memory = data.memoryUsage.rss;
		prevCpuData = currCpuData;
		currCpuData = getProcessCpuData(data.cpuUsage, prevCpuData);
		$scope.displayCpu = currCpuData.totalDiff / microsecondsPerPoll;

		if ($scope.displayCpu < 0) {
			$scope.displayCpu = null;
		}
		$scope.displayCpu = (100*$scope.displayCpu).toFixed(4);
		if(!data.package_id || data.package_id.indexOf('adapter-redis') !== -1) {
			$scope.hideActions = true;
		}
		if ($scope.type === "Adapter") {
			$scope.isAdapter = true;
			$scope.connection = data.connection.state === "ONLINE";
		}
		document.getElementById("console").value=data.logger.console;
		document.getElementById("file").value=data.logger.file;
		document.getElementById("syslog").value=data.logger.syslog;
	}).catch(function(error) {
		throw new Error(error.name, error.message);
	});

	$scope.changeLogLevels = function() {
		var file_level = document.getElementById("file").value;
		var console_level = document.getElementById("console").value;
		var syslog_level = document.getElementById("syslog").value;
		var type;
		if (file_level !== $scope.file_level) {
			$scope.file_level = file_level;
			type = "file";
			changeLogLevel(file_level, type, function(data, err) {
				if (err) {
					return utilities.toast('Error while changing file level', err, 'error', 5000);
				}
				return utilities.toast('File level changed to ', file_level, 'success', 5000);
			});
		}
		if (console_level !== $scope.console_level) {
			$scope.console_level = console_level;
			type = "console";
			changeLogLevel(console_level, type, function(data, err) {
				if (err) {
					return utilities.toast('Error while changing console level', err, 'error', 5000);
				}
				return utilities.toast('Console level changed to ', console_level, 'success', 5000);
			});
		}
		if (syslog_level !== $scope.syslog_level) {
			$scope.syslog_level = syslog_level;
			type = "syslog";
			changeLogLevel(syslog_level, type, function(data, err) {
				if (err) {
					return utilities.toast('Error while changing syslog level', err, 'error', 5000);
				}
				return utilities.toast('syslog level changed to ', syslog_level, 'success', 5000);
			});
		}
	};

	$scope.bytesToPrettyMem = function(bytes) {
		if (bytes === 0) return 0;
		if (bytes < 1) return bytes + 'B';

		var exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1000)), 9);
		var numStr = Number((bytes / Math.pow(1000, exponent)).toPrecision(3));
		var unit = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'][exponent];

		return numStr + unit;
	};

	var changeLogLevel = function(level, type, callback) {
		var details = {"module":moduleId, "transport":type, "level":level};
		utilities.http("POST", urlPrefix + '/modules/setLogging', details)
			.then(function (res) {
				return callback(res);
			})
			.catch(function (err) {
				return callback(null, err);
			});
	};

	$interval(function() {
		$scope.secondPoll = true;

		ProngPromise.all([
			api.getModuleHealthData().then(function(data) {
				if (data.type === "Adapter") {
					$scope.isAdapter = true;
				}
				$scope.status = data.state === 'RUNNING';

				if ($scope.status) {
					$scope.uptime = data.uptime;
					$scope.pid = data.pid;

					$scope.memory = data.memoryUsage.rss;

					if ($scope.type === "Adapter") {
						$scope.connection = data.connection.state === 'ONLINE';
					}
					prevCpuData = currCpuData;
					currCpuData = getProcessCpuData(data.cpuUsage, prevCpuData);
					$scope.displayCpu = ((currCpuData.totalDiff / microsecondsPerPoll)*100).toFixed(4);
					if ($scope.displayCpu < 0) {
						$scope.displayCpu = null;
					}
				} else {
					delete $scope.uptime;
					delete $scope.displayCpu;
					delete $scope.memory;
					delete $scope.connection;
					delete $scope.status;
				}
			})
		]).catch(function(e) {
			delete $scope.uptime;
			delete $scope.displayCpu;
			delete $scope.memory;
			delete $scope.connection;
			delete $scope.status;
		});
	}, pollFrequency);

	// type should be microseconds, milliseconds, or seconds
$scope.secondsToPrettyDate = function(seconds, type) {
	if (!seconds) return '';

	if (type === 'seconds') {
    return [
      parseInt(seconds / 60 / 60, 10),
      parseInt(seconds / 60 % 60, 10),
      parseInt(seconds % 60, 10)
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

$scope.startModule = function(module) {
	$scope.isProcessing = true;

	api.startModule(moduleId).then(function(res) {
		$scope.isProcessing = false;
		$scope.state = true;
	});

	$timeout(function() {
		$scope.isProcessing = false;
	}, attemptTimeoutTime);
};

$scope.stopModule = function() {
	$scope.isProcessing = true;

	api.stopModule(moduleId).then(function(res) {
		$scope.isProcessing = false;
		$scope.state = false;
	});

	$timeout(function() {
		$scope.isProcessing = false;
	}, attemptTimeoutTime);
};

$scope.restartModule = function() {
	$scope.isProcessing = true;

	api.restartModule(moduleId).then(function(res) {
		$scope.isProcessing = false;
		$scope.state = true;
	});

	$timeout(function() {
		$scope.isProcessing = false;
	}, attemptTimeoutTime);
};

}]);