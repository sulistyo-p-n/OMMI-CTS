//
const content = document.getElementById("content");

const app = new PIXI.Application({
	autoResize: true,
	resolution: devicePixelRatio,
	antialias: true,
	autoDensity: true,
	resolution: 2,
});
content.append(app.view);

let layoutObjects = new Array();
let legendObjects = new Array();
let variables = new Array();
let filters = new Array();
let alarms = new Array();

//

let oriPoint = new Point(0.0, 0.0);
let startPoint = null;
let endPoint = null;
let distance = new Point(0.0, 0.0);

let scale = 1.0;
let zoomFactor = scale;
let prevZoomFactor = scale;
const zoomIntensity = 0.1;

let isClick = false;
let isDragable = false;

let startPinchLength = 0.0;
let startScale = scale;

function contextMenuListener(event) {
	event.preventDefault();
	event.stopPropagation();
}

function downListener(event) {
	event.preventDefault();
	event.stopPropagation();

	if (
		event.type == "touchstart" ||
		event.type == "touchmove" ||
		event.type == "touchend" ||
		event.type == "touchcancel"
	) {
		var evt =
			typeof event.originalEvent === "undefined"
				? event
				: event.originalEvent;
		var touches = evt.touches || evt.changedTouches;
		if (touches.length == 1) {
			isClick = true;
			isDragable = true;
			startPoint = new Point(touches[0].pageX, touches[0].pageY);
		} else if (touches.length == 2) {
			isDragable = false;
			const x = touches[1].pageX - touches[0].pageX;
			const y = touches[1].pageY - touches[0].pageY;
			startPinchLength = Math.sqrt(x * x + y * y);
			startScale = scale;
		}
	} else {
		isClick = true;
		isDragable = true;
		startPoint = new Point(event.clientX, event.clientY);
	}
	if (isDragable) {
		distance.x = startPoint.x - oriPoint.x;
		distance.y = startPoint.y - oriPoint.y;
	}
}

function moveListener(event) {
	event.preventDefault();
	event.stopPropagation();

	isClick = false;

	if (
		event.type == "touchstart" ||
		event.type == "touchmove" ||
		event.type == "touchend" ||
		event.type == "touchcancel"
	) {
		var evt =
			typeof event.originalEvent === "undefined"
				? event
				: event.originalEvent;
		var touches = evt.touches || evt.changedTouches;
		if (touches.length == 1) {
			endPoint = new Point(touches[0].pageX, touches[0].pageY);
		} else if (touches.length == 2) {
			const x = touches[1].pageX - touches[0].pageX;
			const y = touches[1].pageY - touches[0].pageY;
			const endPinchLength = Math.sqrt(x * x + y * y);

			zoomFactor = (startScale * endPinchLength) / startPinchLength;
			let mX = touches[0].pageX + x / 2;
			let mY = touches[0].pageY + y / 2;

			oriPoint.x = mX - ((mX - oriPoint.x) / prevZoomFactor) * zoomFactor;
			oriPoint.y = mY - ((mY - oriPoint.y) / prevZoomFactor) * zoomFactor;

			scale = zoomFactor;
			prevZoomFactor = zoomFactor;
		}
	} else {
		endPoint = new Point(event.clientX, event.clientY);
	}

	if (isDragable) {
		oriPoint.x = endPoint.x - distance.x;
		oriPoint.y = endPoint.y - distance.y;
	} else {
		let isHoverObj = false;
		for (const layoutObject of layoutObjects) {
			isHoverObj =
				isHoverObj ||
				(
					layoutObject.isContainsPoint(endPoint) &&
					(
						(
							layoutObject.searchTag != null && 
							layoutObject.isFiltered()
						) ||
					layoutObject.isMoveable)
				);
		}

		content.style.cursor = isHoverObj ? "pointer" : "default";
	}

	refreshLayoutView();
}

function upListener(event) {
	event.preventDefault();
	event.stopPropagation();

	if (
		event.type == "touchstart" ||
		event.type == "touchmove" ||
		event.type == "touchend" ||
		event.type == "touchcancel"
	) {
		var evt =
			typeof event.originalEvent === "undefined"
				? event
				: event.originalEvent;
		var touches = evt.touches || evt.changedTouches;
		if (touches.length == 1) {
			endPoint = new Point(touches[0].pageX, touches[0].pageY);
		}
	} else {
		endPoint = new Point(event.clientX, event.clientY);
	}

	if (isClick && startPoint.x == endPoint.x && startPoint.y == endPoint.y) {
		// alert("x : " + startPoint.x + ", y : " + startPoint.y);

		for (const layoutObject of layoutObjects) {
			if (
				layoutObject.isContainsPoint(endPoint) &&
				layoutObject.searchTag != null &&
				layoutObject.isFiltered()
			) {
				showDetailMenu(layoutObject.searchTag);
			}
		}
	}

	startPoint = null;
	endPoint = null;

	isClick = false;
	isDragable = false;

	zoomFactor = scale;
	prevZoomFactor = scale;
	startScale = scale;

	refreshLayoutView();
}

function wheelListener(event) {
	event.preventDefault();
	event.stopPropagation();

	setZoom(event.deltaY, event.pageX, event.pageY);
}

function moveViewTo(x, y, w, h) {
	oriPoint.x = x;
	oriPoint.y = y;

	if (app.screen.width / w > app.screen.height / h) {
		scale = app.screen.width / w;
	} else {
		scale = app.screen.height / h;
	}
	zoomFactor = scale;
	prevZoomFactor = scale;
	startScale = scale;

	$("#searchInput").val("");
	$("#searchList").hide();

	refreshLayoutView();
}

function setOri() {
	oriPoint.x = 0.0;
	oriPoint.y = 0.0;
	scale = zoomFactor = prevZoomFactor = 1.0;

	// scale = zoomFactor = prevZoomFactor = app.screen.width / (4200 * 2);
	// oriPoint.x = -4020 * scale + app.screen.width / 2;
	// oriPoint.y = -2744.465 * scale + app.screen.height / 2;

	refreshLayoutView();
}

function moveToPoint(x, y) {
	$("#searchInput").val("");
	$("#searchList").hide();

	scale = zoomFactor = prevZoomFactor = 1.0;
	oriPoint.x = -x * scale + app.screen.width / 2;
	oriPoint.y = -y * scale + app.screen.height / 2;

	refreshLayoutView();
}

function setZoom(delta, x, y) {
	if (delta < 0) {
		zoomFactor *= 1.0 + zoomIntensity;
	}
	if (delta > 0) {
		zoomFactor /= 1.0 + zoomIntensity;
	}

	let mX = x;
	let mY = y;

	zoomFactor = zoomFactor <= 2.0 ? zoomFactor : 2.0;

	oriPoint.x = mX - ((mX - oriPoint.x) / prevZoomFactor) * zoomFactor;
	oriPoint.y = mY - ((mY - oriPoint.y) / prevZoomFactor) * zoomFactor;
	scale = zoomFactor;
	prevZoomFactor = zoomFactor;

	refreshLayoutView();
}

function refreshLayoutView() {
	for (const layoutObject of layoutObjects) {
		layoutObject.reDraw(
			oriPoint,
			app.screen.width,
			app.screen.height,
			scale
		);
		// if (!layoutObject.isFiltered()) {
		// 	layoutObject.hide();
		// }
	}
	for (const legendObject of legendObjects) {
		legendObject.reDraw(
			new Point(0.0, app.screen.height - 210),
			app.screen.width,
			app.screen.height,
			1.0
		);
	}

	$("#status").text(
		"x:" +
			oriPoint.x.toFixed(3) +
			", y:" +
			oriPoint.y.toFixed(3) +
			", s:" +
			scale.toFixed(3) +
			", w:" +
			(app.screen.width / scale).toFixed(3) +
			", h:" +
			(app.screen.height / scale).toFixed(3)
	);
}

function resizeView() {
	const w = window.innerWidth + (isRightMenuShow ? -320 : 0);
	const h = window.innerHeight;
	app.renderer.resize(w, h);
}

//

const RightMenuType = {
	Filter: Symbol("filter"),
	Alarm: Symbol("alarm"),
	Detail: Symbol("detail"),
};

let isRightMenuShow = false;
let rightMenuType = RightMenuType.Alarm;
let detailId = null;
let detailMenu = {};

function refreshAlarmData() {
	let counter = 0;

	let toastText = "";
	let activeCount = 0;
	for (const alarm of alarms) {
		if (alarm.firstCheck() && alarm.isFiltered()) {
			if (activeCount == 0) {
				toastText += alarm.title;
			} else {
				toastText += ", " + alarm.title;
			}
			activeCount++;
		}

		alarm.refresh();

		if (alarm.createdDate != null && alarm.isFiltered()) {
			counter++;
		}
	}

	alarms.sort((a, b) =>
		a.createdDate <= b.createdDate
			? 1
			: b.createdDate <= a.createdDate
			? -1
			: 0
	);

	if (counter > 0) {
		$("#alarmButton").addClass("badge-notif");
		$("#alarmButton").attr("data-badge", counter > 99 ? 99 : counter);
	} else {
		$("#alarmButton").removeClass("badge-notif");
		$("#alarmButton").attr("data-badge", 0);
	}

	if (toastText.length > 0) {
		showToastView(toastText);
	}
}

function playAlarmSound() {
	let ding = new Audio("/audio/ding.mp3");
	ding.play();
}

function showToastView(text) {
	var x = document.getElementById("toast");
	x.className = "show";

	$("#toastDesc").text("Alarm Active : " + text);
	playAlarmSound();

	setTimeout(function () {
		x.className = x.className.replace("show", "");
	}, 1000 * 5);
}

function hideRightMenu() {
	isRightMenuShow = false;
	$("#rightSideMenu").hide();
	resizeView();
}

function showRightMenu() {
	isRightMenuShow = true;
	$("#rightSideMenu").show();
	resizeView();
}

function refreshRightMenu() {
	let menu = {
		name: "Loading..",
		detail: [],
	};

	switch (rightMenuType) {
		case RightMenuType.Filter:
			menu = {
				name: "Filter",
				detail: [],
			};

			let isSelectedAll = true;
			for (const filter of filters) {
				let subMenu = {
					name: filter.name,
					value: filter.isActive ? "Active" : "",
					action: filter.name,
				};

				isSelectedAll = isSelectedAll && filter.isActive;

				menu["detail"].push(subMenu);
			}

			menu["detail"].unshift({
				name: "Select All",
				value: isSelectedAll ? "Active" : "",
				action: "filter:selectall",
			});

			break;

		case RightMenuType.Alarm:
			menu = {
				name: "Alarm",
				detail: [],
			};

			for (const alarm of alarms) {
				if (alarm.createdDate != null && alarm.isFiltered()) {
					let subMenu = {
						name: alarm.title,
						value: alarm.createdDate.toLocaleTimeString(),
						action: alarm.title,
					};

					if (alarm.clearedDate != null) {
						subMenu["color"] = "#49e535";
					} else if (alarm.ackDate != null) {
						subMenu["color"] = "#e5e235";
					} else {
						subMenu["color"] = "#e53935";
					}

					menu["detail"].push(subMenu);
				}
			}

			break;

		case RightMenuType.Detail:
			menu = detailMenu;

			break;
	}

	setRightMenu(menu);
}

function showFilterMenu() {
	rightMenuType = RightMenuType.Filter;
	detailId = null;

	clearRightMenu();
	refreshRightMenu();
	showRightMenu();
}

function showAlarmMenu() {
	rightMenuType = RightMenuType.Alarm;
	detailId = null;

	clearRightMenu();
	refreshRightMenu();
	showRightMenu();
}

function showDetailMenu(id) {
	rightMenuType = RightMenuType.Detail;

	if (detailId != id) {
		detailMenu = {
			name: "Loading..",
			detail: [],
		};
		detailId = id;
	}

	clearRightMenu();
	refreshRightMenu();
	showRightMenu();
}

function closeDetailMenu() {
	detailId = null;

	clearRightMenu();
	hideRightMenu();
}

function setRightMenu(datas) {
	if (!("name" in datas)) return;
	$("#rightTitle").text(datas["name"]);
	$("#rightContent").empty();

	if (datas["detail"].length > 0) {
		setLoopMenu("#rightContent", 0, datas["detail"]);
	} else {
		$("#rightContent").append(
			'<p style="text-align:center; color:gray">there is no update yet.</p>'
		);
	}
}

function clearRightMenu() {
	$("#rightTitle").text("");
	$("#rightContent").empty();
}

function setLoopMenu(id, index, datas) {
	let text = "";
	for (let i = 0; i < datas.length; i++) {
		let data = datas[i];

		if (!("name" in data)) continue;

		if ("detail" in data) {
			$(id).append(
				'<div class="sticky head" style="top: ' +
					34 * index +
					"px;" +
					("color" in data
						? " background-color: " + data["color"] + ";"
						: "") +
					'">' +
					data["name"] +
					"</div>"
			);
			// $(id).append('<div class="sticky head" style="top: ' + (34 * index) + 'px;' + ' color: #fff; background-color: ' + '#ff0000' + ';' + '">' + data['name'] + '</div>');
			setLoopMenu(id, index + 1, data["detail"]);
		} else {
			if (i == 0) {
				text += "<ul>";
			}
			text += "<li";
			if ("type" in data) {
				if (data["type"] == "url") {
					text += ">";
					// if ('value' in data) text += '<img style="height: 172px;" src="' + data['value'] + '">';
					if ("value" in data)
						text +=
							'<a href="' +
							data["value"] +
							'" target="_blank">' +
							data["name"] +
							"</a>";
				}
			} else {
				if ("action" in data)
					text +=
						" onclick=\"selectedRowMenu('" +
						data["action"] +
						"'); return false;\"";
				if ("color" in data)
					text +=
						' style="color: #fff; background-color: ' +
						data["color"] +
						';"';
				text += ">";
				text += '<span class="name">' + data["name"] + "</span>";
				if ("value" in data)
					text += '<span class="value">' + data["value"] + "</span>";
			}
			text += "</li>";
			if (i == datas.length - 1) {
				text += "</ul>";
			}
		}
	}
	$(id).append(text);
}

function selectedRowMenu(action) {
	switch (rightMenuType) {
		case RightMenuType.Filter:
			if (action == "filter:selectall") {
				let isSelectedAll = true;
				for (const filter of filters) {
					isSelectedAll = isSelectedAll && filter.isActive;
				}
				for (const filter of filters) {
					filter.isActive = !isSelectedAll;
				}
				refreshLayoutView();
				refreshAlarmData();
				refreshRightMenu();
			} else {
				for (const filter of filters) {
					if (action == filter.name) {
						filter.isActive = !filter.isActive;

						refreshLayoutView();
						refreshAlarmData();
						refreshRightMenu();

						break;
					}
				}
			}
			break;

		case RightMenuType.Alarm:
			for (const layoutObject of layoutObjects) {
				if (layoutObject.searchTag == null) continue;

				if (action == layoutObject.searchTag) {
					moveToPoint(layoutObject.point.x, layoutObject.point.y);
					break;
				}
			}
			break;

		case RightMenuType.Detail:
			break;
	}
}

// Listener

window.addEventListener("resize", resizeView);

// $("#content").addEventListener('mousedown', downListener);
// $("#content").addEventListener('mousemove', moveListener);
// $("#content").addEventListener('mouseup', upListener);
// $("#content").addEventListener('wheel', wheelListener);

// $("#content").addEventListener('touchstart', downListener);
// $("#content").addEventListener('touchmove', moveListener);
// $("#content").addEventListener('touchend', upListener);
// $("#content").addEventListener('touchcancel', upListener);

content.addEventListener("contextmenu", contextMenuListener);

content.addEventListener("mousedown", downListener);
content.addEventListener("mousemove", moveListener);
content.addEventListener("mouseup", upListener);
content.addEventListener("wheel", wheelListener);

content.addEventListener("touchstart", downListener);
content.addEventListener("touchmove", moveListener);
content.addEventListener("touchend", upListener);
content.addEventListener("touchcancel", upListener);

$("#rightMenuButton").on("click", function (e, n) {
	e.preventDefault();
	e.stopPropagation();

	showRightMenu();
});

$("#rightCloseButton").on("click", function (e, n) {
	e.preventDefault();
	e.stopPropagation();

	closeDetailMenu();
});

$("#filterButton").on("click", function (e, n) {
	e.preventDefault();
	e.stopPropagation();

	showFilterMenu();
});

$("#alarmButton").on("click", function (e, n) {
	e.preventDefault();
	e.stopPropagation();

	showAlarmMenu();
});

$("#oriButton").clickAndHold(function (e, n) {
	e.preventDefault();
	e.stopPropagation();

	setOri();
});

$("#plusButton").clickAndHold(function (e, n) {
	e.preventDefault();
	e.stopPropagation();

	setZoom(-1, app.screen.width / 2, app.screen.height / 2);
});

$("#minusButton").clickAndHold(function (e, n) {
	e.preventDefault();
	e.stopPropagation();

	setZoom(1, app.screen.width / 2, app.screen.height / 2);
});

$("#searchInput").on("change keyup paste", function () {
	const value = $("#searchInput").val().trim().toLowerCase();

	if (value.length <= 0) {
		$("#searchList").hide();
		return;
	}

	$("#searchList li").remove();
	let searchList = [];
	for (const layoutObject of layoutObjects) {
		if (layoutObject.searchTag == null) continue;
		if (layoutObject.searchTag.toLowerCase().indexOf(value) < 0) continue;

		searchList.push(layoutObject.searchTag);
		$("#searchList").append(
			'<li onclick="moveToPoint(' +
				layoutObject.point.x +
				"," +
				layoutObject.point.y +
				'); return false;">' +
				layoutObject.searchTag +
				"</li>"
		);
	}

	if (searchList.length <= 0) {
		$("#searchList").hide();
	} else {
		$("#searchList").show();
	}
});

//

const socketIp = "10.10.8.66"; // '192.168.97.82'; //'localhost'; //''192.168.100.150'; //'10.10.8.66';
const socketPort = 4200;
let socket = null;

function setSocket() {
	socket = io.connect("http://" + socketIp + ":" + socketPort);

	socket.on("connect", function (datas) {
		console.log("connect");
		socket.emit("getMapDatas", 0xabcdef);
	});

	socket.on("mapDatas", function (datas) {
		for (const data of datas) {
			for (const variable of variables) {
				if (variable.name == data["name"]) {
					variable.value = data["value"];
				}
			}
		}
		refreshLayoutView();
		refreshAlarmData();
		refreshRightMenu();
	});

	socket.on("detailDatas", function (datas) {
		detailMenu = datas;
		refreshRightMenu();
	});

	setInterval(function () {
		if (socket.connected) {
			socket.emit("getMapDatas", 0xabcdef);
			if (detailId != null) socket.emit("getDetailDatas", detailId);
		}
		// refreshLayoutView();
		// refreshAlarmData();
		// refreshRightMenu();
	}, 1000);
}

// Run
resizeView();
setOri();
refreshLayoutView();
// setSocket();