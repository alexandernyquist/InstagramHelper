/* jshint esnext: true */
/* globals chrome */

var myData = [];

$(function () {

	//build grid
	$("#jqGrid").jqGrid({
		pager: "#jqGridPager",
		datatype: "local",
		data: myData,
		//autowidth: false,
		width: "98%",
		shrinkToFit: true,
		height: "100%",
		rownumbers: true,
		colModel: [{
				label: 'Picture',
				name: 'profile_pic_url_hd',
				width: '320',
				align: 'center',
				sortable: false,
				formatter: function (cellvalue, model, row) {
					return `<a href='https://www.instagram.com/${row.username}' target='_blank'><img src='${cellvalue}' alt='' /></a>`;
				},
				search: false
			}, {
				label: 'Info',
				name: 'id',
				width: '250',
				sortable: false,
				formatter: function (cellvalue, model, row) {
					var ret = `id:${row.id}<br/>username:<strong>${row.username}</strong><br/>`;
					ret += row.full_name ? `full name:<strong>${row.full_name}</strong><br/>` : "";
					ret += row.connected_fb_page ? `FB:<a href='${row.connected_fb_page}' target='_blank'>${row.connected_fb_page}</a><br/>` : "";
					ret += row.external_url ? `url:<a href='${row.external_url}' target='_blank'>${row.external_url}</a>` : "";
					return ret;
				},
				cellattr: function (rowId, tv, rawObject, cm, rdata) {
					return 'style="white-space: normal;"';
				},
				search: false
			}, {
				label: 'Bio',
				name: 'biography',
				sortable: false,
				formatter: function (cellvalue, model, row) {
					return cellvalue ? `<p>${cellvalue}</p>` : "";
				},
				cellattr: function (rowId, tv, rawObject, cm, rdata) {
					return 'style="white-space: normal;"';
				},
				search: false
			}, {
				label: 'Followed',
				name: 'followed_by_viewer',
				width: '80',
				formatter: 'checkbox',
				align: 'center',
				stype: 'select',
				searchoptions: {
					sopt: ["eq"],
					value: ":Any;true:Yes;false:No"
				},
				search: true
			}, {
				label: 'Follows',
				name: 'follows_viewer',
				width: '80',
				formatter: 'checkbox',
				align: 'center',
				stype: 'select',
				searchoptions: {
					sopt: ["eq"],
					value: ":Any;true:Yes;false:No"
				},
				search: true
			}, {
				label: 'Private',
				name: 'is_private',
				width: '80',
				formatter: 'checkbox',
				align: 'center',
				stype: 'select',
				searchoptions: {
					sopt: ["eq"],
					value: ":Any;true:Yes;false:No"
				},
				search: true
			}, {
				label: 'Followers',
				name: 'followers_count',
				width: '75',
				align: 'center',
				sorttype: 'number',
				search: true,
				searchoptions: {
					sopt: ["ge", "le", "eq"]
				}
			}, {
				label: 'Following',
				name: 'following_count',
				width: '75',
				align: 'center',
				sorttype: 'number',
				search: true,
				searchoptions: {
					sopt: ["ge", "le", "eq"]
				}
			}, {
				label: 'Posts',
				name: 'media_count',
				width: '75',
				align: 'center',
				sorttype: 'number',
				search: true,
				searchoptions: {
					sopt: ["ge", "le", "eq"]
				}
			}, {
				name: 'username',
				hidden: true
			}, {
				name: 'id',
				hidden: true
			}, {
				name: 'full_name',
				hidden: true
			}, {
				name: 'connected_fb_page',
				hidden: true
			}, {
				name: 'external_url',
				hidden: true
			}

		],
		viewrecords: true, // show the current page, data rang and total records on the toolbar
		loadonce: true,
		caption: "Instagram Users",
	});

	$('#jqGrid').jqGrid('filterToolbar', {
		searchOperators: true
	});
	$('#jqGrid').jqGrid('navGrid', "#jqGridPager", {
		search: true, // show search button on the toolbar
		add: false,
		edit: false,
		del: false,
		refresh: true
	});

	$("#exportCSV").click(function () {
		var csv = arrayToCSV(myData);
		this.download = "export.csv";
		this.href = "data:application/csv;charset=UTF-16," + encodeURIComponent(csv);
	});

	chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
		if (request.action == "modifyResultPage") {

			getUserProfile(request.userName, function (obj) {
				var fetchSettings = {
					request: null,
					userName: request.userName,
					pageSize: request.pageSize,
					delay: request.delay,
					csrfToken: request.csrfToken,
					userId: obj.id,
					relType: "All" === request.relType ? "followed_by" : request.relType,
					callBoth: "All" === request.relType,
					checkDuplicates: false
				};
				fetchInstaUsers(fetchSettings);
			});
		}
	});
});

//function fetchInstaUsers(request, userName, pageSize, delay, csrfToken, userId, relType) {
function fetchInstaUsers(obj) {
	//	"followed_by" | "follows"

	//console.log(arguments);

	if (!obj.request) {
		obj.request = $.param({
				q: `ig_user(${obj.userId}) {${obj.relType}.first(${obj.pageSize}) {count, page_info {end_cursor, has_next_page},
			nodes {id, is_verified, followed_by_viewer, requested_by_viewer, full_name, profile_pic_url_hd, username, connected_fb_page, 
			external_url, biography, follows_viewer, is_private, follows { count }, followed_by { count }, media { count }}}}`, 
				ref: "relationships::follow_list"
			});
	}

	$.ajax({
		url: "https://www.instagram.com/query/",
		crossDomain: true,
		headers: {
			"X-Instagram-AJAX": '1',
			"X-CSRFToken": obj.csrfToken,
			"X-Requested-With": XMLHttpRequest,
			"eferer": "https://www.instagram.com/" + obj.userName + "/"
		},
		method: 'POST',
		data: obj.request,
		success: function (data, textStatus, xhr) {
			//console.log("success ajax - " + xhr.status); //todo: check 429 here and handle it
			//console.log(arguments);

			for (let i = 0; i < data[obj.relType].nodes.length; i++) {
				var found = false;
				if (obj.checkDuplicates) { //only when the second run happens
					for (let j = 0; j < myData.length; j++) {
						if (data[obj.relType].nodes[i].username === myData[j].username) {
							found = true;
							console.log(`username ${myData[j].username} is found at ${i}`);
							break;
						}
					}
				}
				if (!(found)) {
					data[obj.relType].nodes[i].followers_count = data[obj.relType].nodes[i].followed_by.count;
					data[obj.relType].nodes[i].following_count = data[obj.relType].nodes[i].follows.count;
					data[obj.relType].nodes[i].media_count = data[obj.relType].nodes[i].media.count;
					$('#jqGrid').jqGrid('addRowData', data[obj.relType].nodes[i].id, data[obj.relType].nodes[i]);
				}
			}

			if (data[obj.relType].page_info.has_next_page) {
				obj.request = $.param({
						q: `ig_user(${obj.userId}) {${obj.relType}.after(${data[obj.relType].page_info.end_cursor}, ${obj.pageSize}) {count, page_info {end_cursor, has_next_page},
					nodes {id, is_verified, followed_by_viewer, requested_by_viewer, full_name, profile_pic_url_hd, username, connected_fb_page, 
					external_url, biography, follows_viewer, is_private, follows { count }, followed_by { count }, media { count }}}}`, 
						ref: "relationships::follow_list"
					});

				setTimeout(fetchInstaUsers(obj), obj.delay);
			} else {
				if (obj.callBoth) {
					obj.request = null;
					obj.relType = "follows";
					obj.callBoth = false;
					obj.checkDuplicates = true;
					setTimeout(fetchInstaUsers(obj), obj.delay);
				}
			}
		},
		error: function () {
			console.log("error ajax");
			console.log(arguments);
		}
	});

}

window.onload = function () {
	_gaq.push(['_trackPageview']);
};
