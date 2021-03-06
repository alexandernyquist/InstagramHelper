/* exported exportUtils */
/* globals instaDefOptions */

var exportUtils = (function() {

    'use strict';

	var replaceStr = function(str) {

		var arr = str.match(instaDefOptions.regCheckBox);
		if ((arr||[]).length > 0) {
			return arr[1];
		}
		arr = str.match(instaDefOptions.regProfile);
		if ((arr||[]).length > 0) {
			return arr[1];
		}
		//TODO: would be nice to have in replaceStr the name of the column
		if (instaDefOptions.regTestInfo.test(str)) { //this is our Info column,
			str = str
				.replace(instaDefOptions.newLine, ',' + String.fromCharCode(10))
				.replace(instaDefOptions.cleanInfo, '');
			return str;
		}
		return str;
	};

	var formatDate = function (date) {

		var year = date.getFullYear(),
			month = date.getMonth() + 1,
			day = date.getDate(),
			hour = date.getHours(),
			minute = date.getMinutes();
		month = '00'.substr(('' + month).length, 1) + month;
		hour = '00'.substr(('' + hour).length, 1) + hour;
		day = '00'.substr(('' + day).length, 1) + day;
		minute = '00'.substr(('' + minute).length, 1) + minute;
		return '' + year + month + day + '_' + hour + minute;
	};

	return {
		replaceStr : replaceStr,
		formatDate : formatDate
	};

}());
