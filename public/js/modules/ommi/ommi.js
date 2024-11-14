let isAllVisible = false;

const ColorType = {
	Solid: Symbol("solid"),
	Linear: Symbol("linear"),
	Radial: Symbol("radial"),
};

const Direction = {
	Left: Symbol("left"),
	Right: Symbol("right"),
	Up: Symbol("up"),
	Down: Symbol("down"),
};

const Comparation = {
	EqualTo: Symbol("=="),
	NotEqualTo: Symbol("!="),
	GreaterThan: Symbol(">"),
	LessThan: Symbol("<"),
	GreaterThanOrEqualTo: Symbol(">="),
	LessThanOrEqualTo: Symbol("<="),
};

class Point {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

class Anchor {
	constructor(h, v) {
		this.h = h;
		this.v = v;
	}
}

class Filter {
	constructor() {
		this.title = "";
		this.desc = "";

		this.isActive = true;
	}
}

class Variable {
	constructor() {
		this.name = "";
		this.value = false;
		this.fromVariable = null;
	}

	getValue() {
		if (this.fromVariable == null) return this.value;
		return this.fromVariable.getValue();
	}
}

class CheckVariable {
	constructor() {
		this.variable = new Variable();
		this.comparation = Comparation.EqualTo;
		this.activeValue = true;
	}

	isActive() {
		switch (this.comparation) {
			case Comparation.EqualTo:
				return this.variable.getValue() == this.activeValue;
			case Comparation.NotEqualTo:
				return this.variable.getValue() != this.activeValue;
			case Comparation.GreaterThan:
				return this.variable.getValue() > this.activeValue;
			case Comparation.LessThan:
				return this.variable.getValue() < this.activeValue;
			case Comparation.GreaterThanOrEqualTo:
				return this.variable.getValue() >= this.activeValue;
			case Comparation.LessThanOrEqualTo:
				return this.variable.getValue() <= this.activeValue;
			default:
				return false;
		}
	}
}

class Alarm {
	constructor() {
		this.title = "";
		this.desc = "";

		this.createdDate = null;
		this.ackDate = null;
		this.clearedDate = null;

		this.variable = new CheckVariable();

		this.filters = new Array();
	}

	isActive() {
		if (!Array.isArray(this.variable)) {
			return this.variable.isActive();
		}

		let status = true;
		for (const variable of this.variable) {
			status = status && variable.isActive();
		}

		return status;
	}

	isShow() {
		let status = false;
		for (const filter of this.filters) {
			status = status || filter.isActive();
		}

		return status;
	}

	firstCheck() {
		return this.isActive() && this.createdDate == null;
	}

	refresh() {
		if (this.isActive()) {
			if (
				this.createdDate == null ||
				(this.createdDate != null && this.clearedDate != null)
			) {
				this.createdDate = new Date();
				this.ackDate = null;
				this.clearedDate = null;
			}
		} else {
			if (this.createdDate != null) {
				this.clearedDate = new Date();

				this.createdDate = null; // NOTE : sementara, sampai bisa di ack
			}
		}
	}

	ack() {
		// this.ackDate = new Date();
	}

	clear() {
		this.createdDate = null;
		this.ackDate = null;
		this.clearedDate = null;
	}

	isFiltered() {
		let status = false;
		for (const filter of this.filters) {
			status = status || filter.isActive;
		}

		return status;
	}
}

class Style {
	constructor() {
		this.scale = 1.0;

		this.isUseFill = true;
		this.fillType = ColorType.Solid;
		this.fillColor = 0x666666;
		this.fillAlpha = 1.0;

		this.isUseLine = true;
		this.lineType = ColorType.Solid;
		this.lineSize = 1.0;
		this.lineColor = 0xffffff;
		this.lineAlpha = 1.0;

		this.isUseText = true;
		this.text = "";
		this.fontColor = 0xffffff;
		this.fontSize = 12.0;
		this.fontFamily = "Arial";
		this.isFontBold = false;
		this.isFontItalic = false;
		this.textAnchor = new Anchor(0.5, 0.5);
		this.isReadable = true;
		this.isTextCrop = false;
		this.isTextAutoScroll = false;

		this.lastFillTexture = null;
		this.lastFillScale = 1.0;

		this.lastLineTexture = null;
		this.lastLineScale = 1.0;
	}

	clone() {
		let style = new Style();

		style.scale = this.scale;

		style.isUseFill = this.isUseFill;
		style.fillColor = this.fillColor;
		style.fillAlpha = this.fillAlpha;

		style.isUseLine = this.isUseLine;
		style.lineType = this.lineType;
		style.lineSize = this.lineSize;
		style.lineColor = this.lineColor;
		style.lineAlpha = this.lineAlpha;

		style.isUseText = this.isUseText;
		style.text = this.text;
		style.fontColor = this.fontColor;
		style.fontSize = this.fontSize;
		style.fontFamily = this.fontFamily;
		style.isFontBold = this.isFontBold;
		style.isFontItalic = this.isFontItalic;
		style.textAnchor = new Anchor(this.textAnchor.h, this.textAnchor.v);
		style.isReadable = this.isReadable;
		style.isTextCrop = this.isTextCrop;
		style.isTextAutoScroll = this.isTextAutoScroll;

		return style;
	}
}

class Mark {
	constructor() {
		this.variable = new CheckVariable();
		this.style = new Style();
	}

	isActive() {
		if (!Array.isArray(this.variable)) {
			return this.variable.isActive();
		}

		let status = true;
		for (const variable of this.variable) {
			status = status && variable.isActive();
		}

		return status;
	}
}

class BaseObject {
	constructor() {
		this.point = new Point(0.0, 0.0);

		this.desc = "";
		this.tag = null;
		this.searchTag = null;

		this.filters = new Array();

		this.isMoveable = true;
	}

	addAt(stage) {}

	reDraw(ori, screenW, screenH, scale) {}

	isContainsPoint(pointer) {
		return false;
	}

	isFiltered() {
		let status = false;
		for (const filter of this.filters) {
			status = status || filter.isActive;
		}

		return status;
	}

	hide() {}
}

class GroupObject extends BaseObject {
	constructor() {
		super();

		this.variables = [];
		this.baseObjects = [];
		this.configs = {};
	}

	addAt(stage) {
		for (const baseObject of this.baseObjects) {
			baseObject.addAt(stage);
		}
	}

	reDraw(ori, screenW, screenH, scale) {
		for (const baseObject of this.baseObjects) {
			const currentPoint = new Point(
				oriPoint.x + this.point.x * scale,
				oriPoint.y + this.point.y * scale
			);
			baseObject.reDraw(currentPoint, screenW, screenH, scale);
		}
	}

	isContainsPoint(pointer) {
		let isContain = false;
		for (const baseObject of this.baseObjects) {
			isContain = isContain || baseObject.isContainsPoint(pointer);
		}
		return isContain;
	}

	hide() {
		for (const baseObject of this.baseObjects) {
			baseObject.hide();
		}
	}
}

class DrawObject extends BaseObject {
	constructor() {
		super();

		this.anchor = new Anchor(0.5, 0.5);

		this.w = 10.0;
		this.h = 10.0;

		this.a = 0.0;

		this.isHideNA = false;
		this.baseStyle = new Style();
		this.marks = new Array();

		this.obj = new PIXI.Graphics();
		this.objText = new PIXI.Text();
	}

	getWidth() {
		let activeStyle = this.getActiveStyle();
		return this.w * activeStyle.scale;
	}

	getHeight() {
		let activeStyle = this.getActiveStyle();
		return this.h * activeStyle.scale;
	}

	addAt(stage) {
		stage.addChild(this.obj);
		stage.addChild(this.objText);
	}

	getGradient(colors, alphas, scale) {
		const currentW = this.getWidth() * scale;
		const currentH = this.getHeight() * scale;

		const c = document.createElement("canvas");
		c.width = currentW;
		c.height = currentH;
		const ctx = c.getContext("2d");
		const grd = ctx.createLinearGradient(
			0,
			currentH / 2,
			currentW,
			currentH / 2
		);

		for (let i = 0; i < colors.length; i++) {
			const r = (colors[i] >> 16) & 0xff;
			const g = (colors[i] >> 8) & 0xff;
			const b = colors[i] & 0xff;
			grd.addColorStop(
				(1 / (colors.length - 1)) * i,
				"rgba(" + r + "," + g + "," + b + "," + alphas[i] + ")"
			);
		}

		ctx.fillStyle = grd;
		ctx.fillRect(0, 0, currentW, currentH);

		return PIXI.Texture.from(c);
	}

	getActiveStyle() {
		for (const mark of this.marks) {
			if (mark.isActive()) {
				return mark.style;
			}
		}
		if (this.isHideNA && !isAllVisible) {
			return null;
		}
		return this.baseStyle;
	}

	getTextWidth() {
		
	}

	setShape(obj, scale) {
		obj.drawRect(
			0.0,
			0.0,
			this.getWidth() * scale,
			this.getHeight() * scale
		);
	}

	setFill(activeStyle, scale) {
		if (activeStyle.isUseFill || activeStyle.isTextCrop) {
			if (!Array.isArray(activeStyle.fillColor)) {
				this.obj.beginFill(
					activeStyle.fillColor,
					activeStyle.fillAlpha
				);
			} else if (
				activeStyle.fillType == ColorType.Solid ||
				activeStyle.fillColor.length <= 1
			) {
				this.obj.beginFill(
					activeStyle.fillColor[0],
					activeStyle.fillAlpha[0]
				);
			} else {
				if (
					activeStyle.fillTexture == null ||
					activeStyle.lastFillScale != scale
				) {
					activeStyle.fillTexture = this.getGradient(
						activeStyle.fillColor,
						activeStyle.fillAlpha,
						scale
					);
					activeStyle.lastFillScale = scale;
				}
				if (activeStyle.fillType == ColorType.Linear) {
					this.obj.beginTextureFill({
						texture: activeStyle.fillTexture,
					});
				} else if (activeStyle.fillType == ColorType.Radial) {
					this.obj.beginTextureFill({
						texture: activeStyle.fillTexture,
					});
				}
			}

			this.setShape(this.obj, scale);
			this.obj.endFill();
		}
	}

	setLine(activeStyle, scale) {
		if (activeStyle.isUseLine) {
			if (!Array.isArray(activeStyle.lineColor)) {
				this.obj.lineStyle(
					activeStyle.lineSize * scale,
					activeStyle.lineColor,
					activeStyle.lineAlpha
				);
			} else if (
				activeStyle.lineType == ColorType.Solid ||
				activeStyle.lineColor.length <= 1
			) {
				this.obj.lineStyle(
					activeStyle.lineSize * scale,
					activeStyle.lineColor[0],
					activeStyle.lineAlpha[0]
				);
			} else {
				if (
					activeStyle.lineTexture == null ||
					this.lastLineScale != scale
				) {
					activeStyle.lineTexture = this.getGradient(
						activeStyle.lineColor,
						activeStyle.lineAlpha,
						scale
					);
					activeStyle.lastLineScale = scale;
				}
				if (activeStyle.lineType == ColorType.Linear) {
					this.obj.lineTextureStyle({
						width: activeStyle.lineSize * scale,
						texture: activeStyle.lineTexture,
					});
				} else if (activeStyle.lineType == ColorType.Radial) {
					this.obj.lineTextureStyle({
						width: activeStyle.lineSize * scale,
						texture: activeStyle.lineTexture,
					});
				}
			}

			this.setShape(this.obj, scale);
			this.obj.endFill();
		}
	}

	setText(activeStyle, scale) {
		if (activeStyle.isUseText) {
			this.objText.text = activeStyle.text;
			this.objText.style = new PIXI.TextStyle({
				fontFamily: activeStyle.fontFamily,
				fontSize: activeStyle.fontSize * scale * 1.3,
				fill: activeStyle.fontColor,
				FontStyle: activeStyle.isFontItalic ? "italic" : "normal",
				fontWeight: activeStyle.isFontBold ? "bold" : "normal",
			});
			
			if (activeStyle.isTextCrop) {
				this.objText.mask = this.obj;
			}
		}
	}

	setShapePosition(ori, scale) {
		let currenPoint = new Point(
			ori.x + this.point.x * scale,
			ori.y + this.point.y * scale
		);
		let currentW = this.getWidth() * scale;
		let currentH = this.getHeight() * scale;

		this.obj.position.set(currenPoint.x, currenPoint.y);
		this.obj.pivot.set(currentW * this.anchor.h, currentH * this.anchor.v);
		this.obj.rotation = this.a;
	}

	setTextPosition(ori, activeStyle, scale) {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext('2d');
		ctx.font = (activeStyle.isFontBold ? "bold " : "") + (activeStyle.fontSize * 1.3) + "px " + activeStyle.fontFamily;
		let text = ctx.measureText(activeStyle.text);

		let h = this.anchor.h;
		let v = this.anchor.v;
		let th = (activeStyle.isTextAutoScroll && text.width > this.getWidth()) ? 0.0 : activeStyle.textAnchor.h;
		let tv = activeStyle.textAnchor.v;
		let a = this.a;

		if (
			activeStyle.isReadable &&
			this.a < (270 * Math.PI) / 180 &&
			this.a >= (90 * Math.PI) / 180
		) {
			h = 1.0 - h;
			th = 1.0 - th;
			a = a + Math.PI;
		}

		let currenPoint = new Point(
			ori.x + this.point.x * scale,
			ori.y + this.point.y * scale
		);
		let currentW = this.getWidth() * scale;
		let currentH = this.getHeight() * scale;

		const dX = currentW * th - currentW * h;
		const dY = currentH * tv - currentH * v;
		const tl = Math.sqrt(dX * dX + dY * dY);
		const ta = Math.atan2(dY, dX);

		let addX = 0;
		let addY = 0;
		if (activeStyle.isTextAutoScroll && text.width > this.getWidth()) {
			if (this.startTime == null) this.startTime = new Date();
			const currentDate = new Date();
			const ms = currentDate.getTime() - this.startTime.getTime();
			const move = (ms / 60 * 5) % (this.getWidth() + text.width); // 60FpS, 5PXpF
			addX = ((this.getWidth() - move) * scale)* Math.cos(a);
			addY = ((this.getWidth() - move) * scale)* Math.sin(a);
		}
		const textX = tl * Math.cos(a + ta) + addX;
		const textY = tl * Math.sin(a + ta) + addY;
		this.objText.position.set(currenPoint.x + textX, currenPoint.y + textY);
		this.objText.rotation = a;
		this.objText.anchor.set(th, tv);
	}

	isOverLap(ori, screenW, screenH, scale) {
		const tolerance = 0;
		let currentW = this.getWidth() * scale + tolerance;
		let currentH = this.getHeight() * scale + tolerance;
		let currenPoint = new Point(
			ori.x + this.point.x * scale - currentW * this.anchor.h,
			ori.y + this.point.y * scale - currentH * this.anchor.v
		);

		if (currenPoint.x + currentW < -tolerance || currenPoint.x > screenW) {
			return false;
		}

		if (currenPoint.y + currentH < -tolerance || currenPoint.y > screenH) {
			return false;
		}

		// TODO USE ANGLE

		return true;
	}

	reDraw(ori, screenW, screenH, scale) {
		let activeStyle = this.getActiveStyle();

		this.obj.clear();
		if (
			activeStyle == null ||
			!this.isOverLap(ori, screenW, screenH, scale)
		) {
			this.obj.visible = false;
			this.objText.visible = false;
			return;
		}

		let currenPoint = new Point(
			ori.x + this.point.x * scale,
			ori.y + this.point.y * scale
		);
		let currentW = this.getWidth() * scale;
		let currentH = this.getHeight() * scale;

		this.obj.visible = currentW > 3 || currentH > 3;
		this.objText.visible = activeStyle.fontSize * scale * 1.3 > 4.5;

		this.setFill(activeStyle, scale);
		this.setLine(activeStyle, scale);
		this.setText(activeStyle, scale);

		this.setShapePosition(ori, scale);
		this.setTextPosition(ori, activeStyle, scale);
	}

	isContainsPoint(pointer) {
		if (this.obj.containsPoint(new PIXI.Point(pointer.x, pointer.y))) {
			// console.log("masuk obj");
			return true;
		} else if (
			this.objText.containsPoint(new PIXI.Point(pointer.x, pointer.y))
		) {
			// console.log("masuk objText");
			return true;
		}
		return false;
	}

	hide() {
		this.obj.visible = false;
		this.objText.visible = false;
	}
}

class RectObject extends DrawObject {
	constructor() {
		super();
	}

	setShape(obj, scale) {
		obj.drawRect(
			0.0,
			0.0,
			this.getWidth() * scale,
			this.getHeight() * scale
		);
	}
}

class RoundRectObject extends DrawObject {
	constructor() {
		super();
		this.roundTip = 4.0;
	}

	setShape(obj, scale) {
		obj.drawRoundedRect(
			0.0,
			0.0,
			this.getWidth() * scale,
			this.getHeight() * scale,
			this.roundTip * scale
		);
	}
}

class EllipseObject extends DrawObject {
	constructor() {
		super();
	}

	setShape(obj, scale) {
		obj.drawEllipse(
			(this.getWidth() * scale) / 2,
			(this.getHeight() * scale) / 2,
			(this.getWidth() * scale) / 2,
			(this.getHeight() * scale) / 2
		);
	}
}

class DiamondObject extends DrawObject {
	constructor() {
		super();
	}

	setShape(obj, scale) {
		obj.moveTo((this.getWidth() * scale) / 2, 0.0);
		obj.lineTo(this.getWidth() * scale, (this.getHeight() * scale) / 2);
		obj.lineTo((this.getWidth() * scale) / 2, this.getHeight() * scale);
		obj.lineTo(0.0, (this.getHeight() * scale) / 2);
		obj.closePath();
	}
}

class ParallelogramObject extends DrawObject {
	constructor() {
		super();
		this.size = 4.0;
		this.dir = Direction.Left;
	}

	setShape(obj, scale) {
		switch (this.dir) {
			case Direction.Right:
				obj.moveTo(this.getWidth() * scale, 0.0);
				obj.lineTo(this.getWidth() * scale - this.size * scale, 0.0);
				obj.lineTo(0.0, this.getHeight() * scale);
				obj.lineTo(this.size * scale, this.getHeight() * scale);
				obj.closePath();
				break;
			case Direction.Up:
				obj.moveTo(0.0, 0.0);
				obj.lineTo(0.0, this.size * scale);
				obj.lineTo(this.getWidth() * scale, this.getHeight() * scale);
				obj.lineTo(
					this.getWidth() * scale,
					this.getHeight() * scale - this.size * scale
				);
				obj.closePath();
				break;
			case Direction.Left:
				obj.moveTo(0.0, 0.0);
				obj.lineTo(
					this.getWidth() * scale - this.size * scale,
					this.getHeight() * scale
				);
				obj.lineTo(this.getWidth() * scale, this.getHeight() * scale);
				obj.lineTo(this.size * scale, 0.0);
				obj.closePath();
				break;
			case Direction.Down:
				obj.moveTo(0.0, this.getHeight() * scale);
				obj.lineTo(this.getWidth() * scale, this.size * scale);
				obj.lineTo(this.getWidth() * scale, 0.0);
				obj.lineTo(0.0, this.getHeight() * scale - this.size * scale);
				obj.closePath();
				break;
		}
	}
}

class TriangleObject extends DrawObject {
	constructor() {
		super();
		this.dir = Direction.Left;
	}

	setShape(obj, scale) {
		switch (this.dir) {
			case Direction.Right:
				obj.moveTo(
					this.getWidth() * scale,
					(this.getHeight() * scale) / 2
				);
				obj.lineTo(0.0, 0.0);
				obj.lineTo(0.0, this.getHeight() * scale);
				obj.closePath();
				break;
			case Direction.Up:
				obj.moveTo((this.getWidth() * scale) / 2, 0.0);
				obj.lineTo(0.0, this.getHeight() * scale);
				obj.lineTo(this.getWidth() * scale, this.getHeight() * scale);
				obj.closePath();
				break;
			case Direction.Left:
				obj.moveTo(0.0, (this.getHeight() * scale) / 2);
				obj.lineTo(this.getWidth() * scale, this.getHeight() * scale);
				obj.lineTo(this.getWidth() * scale, 0.0);
				obj.closePath();
				break;
			case Direction.Down:
				obj.moveTo(
					(this.getWidth() * scale) / 2,
					this.getHeight() * scale
				);
				obj.lineTo(this.getWidth() * scale, 0.0);
				obj.lineTo(0.0, 0.0);
				obj.closePath();
				break;
		}
	}
}

class LineObject extends DrawObject {
	constructor() {
		super();

		this.d = 10.0;
		this.joins = [];

		this.isCurve = true;

		this.baseStyle.isUseLine = false;
	}

	getShapePoints() {
		let points = [];

		if (this.joins.length <= 1) return points;

		let p1 = null;
		let p2 = null;

		for (let i = 0; i < this.joins.length - 1; i++) {
			const dX = this.joins[i + 1].x - this.joins[i].x;
			const dY = this.joins[i + 1].y - this.joins[i].y;
			const a = Math.atan2(dY, dX);
			const degree = (a * 180) / Math.PI;

			let x1 =
				this.joins[i].x +
				(this.d / 2) * Math.cos(((degree + 90) * Math.PI) / 180);
			let y1 =
				this.joins[i].y +
				(this.d / 2) * Math.sin(((degree + 90) * Math.PI) / 180);

			let x2 =
				this.joins[i + 1].x +
				(this.d / 2) * Math.cos(((degree + 90) * Math.PI) / 180);
			let y2 =
				this.joins[i + 1].y +
				(this.d / 2) * Math.sin(((degree + 90) * Math.PI) / 180);

			if (p1 == null) {
				p1 = new Point(x1, y1);
				p2 = new Point(x2, y2);

				points.push(new Point(x1, y1));
			} else {
				points.push(
					getIntersectPoint(
						p1,
						p2,
						new Point(x1, y1),
						new Point(x2, y2)
					)
				);

				p1 = new Point(x1, y1);
				p2 = new Point(x2, y2);
			}

			if (i == this.joins.length - 2) {
				p1 = null;
				p2 = null;
				points.push(new Point(x2, y2));
			}
		}

		for (let i = this.joins.length - 2; i >= 0; i--) {
			const dX = this.joins[i + 1].x - this.joins[i].x;
			const dY = this.joins[i + 1].y - this.joins[i].y;
			const a = Math.atan2(dY, dX);
			const degree = (a * 180) / Math.PI;

			let x1 =
				this.joins[i + 1].x +
				(this.d / 2) * Math.cos(((degree + 270) * Math.PI) / 180);
			let y1 =
				this.joins[i + 1].y +
				(this.d / 2) * Math.sin(((degree + 270) * Math.PI) / 180);

			let x2 =
				this.joins[i].x +
				(this.d / 2) * Math.cos(((degree + 270) * Math.PI) / 180);
			let y2 =
				this.joins[i].y +
				(this.d / 2) * Math.sin(((degree + 270) * Math.PI) / 180);

			if (p1 == null) {
				p1 = new Point(x1, y1);
				p2 = new Point(x2, y2);

				points.push(new Point(x1, y1));
			} else {
				points.push(
					getIntersectPoint(
						p1,
						p2,
						new Point(x1, y1),
						new Point(x2, y2)
					)
				);

				p1 = new Point(x1, y1);
				p2 = new Point(x2, y2);
			}

			if (i == 0) {
				p1 = null;
				p2 = null;
				points.push(new Point(x2, y2));
			}
		}

		return points;
	}

	getMinPoint() {
		let minPoint = new Point();

		const shapePoints = this.getShapePoints();
		for (let i = 0; i < shapePoints.length; i++) {
			minPoint.x =
				minPoint.x < shapePoints[i].x ? minPoint.x : shapePoints[i].x;
			minPoint.y =
				minPoint.y < shapePoints[i].y ? minPoint.y : shapePoints[i].y;
		}

		return minPoint;
	}

	getWidth() {
		let minX,
			maxX = 0;

		const shapePoints = this.getShapePoints();
		for (let i = 0; i < shapePoints.length; i++) {
			minX = minX < shapePoints[i].x ? minX : shapePoints[i].x;
			maxX = maxX > shapePoints[i].x ? maxX : shapePoints[i].x;
		}

		return Math.abs(maxX - minX);
	}

	getHeight() {
		let minY,
			maxY = 0;

		const shapePoints = this.getShapePoints();
		for (let i = 0; i < shapePoints.length; i++) {
			minY = minY < shapePoints[i].y ? minY : shapePoints[i].y;
			maxY = maxY > shapePoints[i].y ? maxY : shapePoints[i].y;
		}

		return Math.abs(maxY - minY);
	}

	getGradient(colors, alphas, scale) {
		const currentW = this.getWidth() * scale;
		const currentH = this.getHeight() * scale;

		const c = document.createElement("canvas");
		c.width = currentW + 1;
		c.height = currentH + 1;
		const ctx = c.getContext("2d");

		let grd;
		if (this.joins.length <= 1) {
			grd = ctx.createLinearGradient(
				0,
				currentH / 2,
				currentW,
				currentH / 2
			);
		} else {
			const minPoint = this.getMinPoint();
			grd = ctx.createLinearGradient(
				(this.joins[0].x - minPoint.x) * scale,
				(this.joins[0].y - minPoint.y) * scale,
				(this.joins[this.joins.length - 1].x - minPoint.x) * scale,
				(this.joins[this.joins.length - 1].y - minPoint.y) * scale
			);
		}

		for (let i = 0; i < colors.length; i++) {
			const r = (colors[i] >> 16) & 0xff;
			const g = (colors[i] >> 8) & 0xff;
			const b = colors[i] & 0xff;
			grd.addColorStop(
				(1 / (colors.length - 1)) * i,
				"rgba(" + r + "," + g + "," + b + "," + alphas[i] + ")"
			);
		}

		ctx.fillStyle = grd;
		ctx.fillRect(0, 0, currentW + 1, currentH + 1);

		return PIXI.Texture.from(c);
	}

	setShape(obj, scale) {
		const shapePoints = this.getShapePoints();

		if (shapePoints.length <= 1) return;

		const minPoint = this.getMinPoint();

		const s = 2;

		const middleIndex = Math.ceil(shapePoints.length / 2);

		const firstHalf = shapePoints.splice(0, middleIndex);

		obj.moveTo(
			(firstHalf[0].x - minPoint.x) * scale,
			(firstHalf[0].y - minPoint.y) * scale
		);

		for (let i = 1; i < firstHalf.length - 1; i++) {
			if (!this.isCurve) {
				obj.lineTo(
					(firstHalf[i].x - minPoint.x) * scale,
					(firstHalf[i].y - minPoint.y) * scale
				);
			} else {
				let r1 =
					(s * this.d) /
					Math.sqrt(
						Math.pow(firstHalf[i - 1].x - firstHalf[i].x, 2) +
							Math.pow(firstHalf[i - 1].y - firstHalf[i].y, 2)
					);
				let r2 =
					(s * this.d) /
					Math.sqrt(
						Math.pow(firstHalf[i + 1].x - firstHalf[i].x, 2) +
							Math.pow(firstHalf[i + 1].y - firstHalf[i].y, 2)
					);

				r1 = r1 < 0.5 ? r1 : 0.5;
				r2 = r2 < 0.5 ? r2 : 0.5;

				obj.lineTo(
					(firstHalf[i].x +
						(firstHalf[i - 1].x - firstHalf[i].x) * r1 -
						minPoint.x) *
						scale,
					(firstHalf[i].y +
						(firstHalf[i - 1].y - firstHalf[i].y) * r1 -
						minPoint.y) *
						scale
				);

				obj.bezierCurveTo(
					(firstHalf[i].x +
						(firstHalf[i - 1].x - firstHalf[i].x) * r1 -
						minPoint.x) *
						scale,
					(firstHalf[i].y +
						(firstHalf[i - 1].y - firstHalf[i].y) * r1 -
						minPoint.y) *
						scale,
					(firstHalf[i].x - minPoint.x) * scale,
					(firstHalf[i].y - minPoint.y) * scale,
					(firstHalf[i].x +
						(firstHalf[i + 1].x - firstHalf[i].x) * r2 -
						minPoint.x) *
						scale,
					(firstHalf[i].y +
						(firstHalf[i + 1].y - firstHalf[i].y) * r2 -
						minPoint.y) *
						scale
				);

				obj.lineTo(
					(firstHalf[i].x +
						(firstHalf[i + 1].x - firstHalf[i].x) * r2 -
						minPoint.x) *
						scale,
					(firstHalf[i].y +
						(firstHalf[i + 1].y - firstHalf[i].y) * r2 -
						minPoint.y) *
						scale
				);
			}
		}

		obj.lineTo(
			(firstHalf[firstHalf.length - 1].x - minPoint.x) * scale,
			(firstHalf[firstHalf.length - 1].y - minPoint.y) * scale
		);

		const secondHalf = shapePoints.splice(-middleIndex);

		obj.lineTo(
			(secondHalf[0].x - minPoint.x) * scale,
			(secondHalf[0].y - minPoint.y) * scale
		);

		for (let i = 1; i < secondHalf.length - 1; i++) {
			if (!this.isCurve) {
				obj.lineTo(
					(secondHalf[i].x - minPoint.x) * scale,
					(secondHalf[i].y - minPoint.y) * scale
				);
			} else {
				let r1 =
					(s * this.d) /
					Math.sqrt(
						Math.pow(secondHalf[i - 1].x - secondHalf[i].x, 2) +
							Math.pow(secondHalf[i - 1].y - secondHalf[i].y, 2)
					);
				let r2 =
					(s * this.d) /
					Math.sqrt(
						Math.pow(secondHalf[i + 1].x - secondHalf[i].x, 2) +
							Math.pow(secondHalf[i + 1].y - secondHalf[i].y, 2)
					);

				r1 = r1 < 0.5 ? r1 : 0.5;
				r2 = r2 < 0.5 ? r2 : 0.5;

				obj.lineTo(
					(secondHalf[i].x +
						(secondHalf[i - 1].x - secondHalf[i].x) * r1 -
						minPoint.x) *
						scale,
					(secondHalf[i].y +
						(secondHalf[i - 1].y - secondHalf[i].y) * r1 -
						minPoint.y) *
						scale
				);

				obj.bezierCurveTo(
					(secondHalf[i].x +
						(secondHalf[i - 1].x - secondHalf[i].x) * r1 -
						minPoint.x) *
						scale,
					(secondHalf[i].y +
						(secondHalf[i - 1].y - secondHalf[i].y) * r1 -
						minPoint.y) *
						scale,
					(secondHalf[i].x - minPoint.x) * scale,
					(secondHalf[i].y - minPoint.y) * scale,
					(secondHalf[i].x +
						(secondHalf[i + 1].x - secondHalf[i].x) * r2 -
						minPoint.x) *
						scale,
					(secondHalf[i].y +
						(secondHalf[i + 1].y - secondHalf[i].y) * r2 -
						minPoint.y) *
						scale
				);

				obj.lineTo(
					(secondHalf[i].x +
						(secondHalf[i + 1].x - secondHalf[i].x) * r2 -
						minPoint.x) *
						scale,
					(secondHalf[i].y +
						(secondHalf[i + 1].y - secondHalf[i].y) * r2 -
						minPoint.y) *
						scale
				);
			}
		}

		obj.lineTo(
			(secondHalf[secondHalf.length - 1].x - minPoint.x) * scale,
			(secondHalf[secondHalf.length - 1].y - minPoint.y) * scale
		);

		obj.closePath();
	}

	setShapePosition(ori, scale) {
		let currenPoint = new Point(
			ori.x + this.point.x * scale,
			ori.y + this.point.y * scale
		);
		let currentW = this.getWidth() * scale;
		let currentH = this.getHeight() * scale;

		const minPoint = this.getMinPoint();
		this.obj.position.set(currenPoint.x, currenPoint.y);
		this.obj.pivot.set(-minPoint.x * scale, -minPoint.y * scale);
		this.obj.rotation = this.a;
	}

	isOverLap(ori, screenW, screenH, scale) {
		const tolerance = 0;
		let currentW = this.getWidth() * scale + tolerance;
		let currentH = this.getHeight() * scale + tolerance;

		const minPoint = this.getMinPoint();
		let currenPoint = new Point(
			ori.x + this.point.x * scale - -minPoint.x * scale,
			ori.y + this.point.y * scale - -minPoint.y * scale
		);

		if (currenPoint.x + currentW < -tolerance || currenPoint.x > screenW) {
			return false;
		}

		if (currenPoint.y + currentH < -tolerance || currenPoint.y > screenH) {
			return false;
		}

		return true;
	}
}

function removeAllChild(stage) {
	while (stage.children[0]) {
		stage.removeChild(stage.children[0]);
	}
}

function BGRToRGBString(dColor) {
	return (
		"#" +
		(
			"000000" +
			(
				((dColor & 0xff) << 16) +
				(dColor & 0xff00) +
				((dColor >> 16) & 0xff)
			).toString(16)
		).slice(-6)
	);
}

function RGBStringToBGR(hex) {
	const r = parseInt(hex.slice(1, 3), 16),
		g = parseInt(hex.slice(3, 5), 16),
		b = parseInt(hex.slice(5, 7), 16);
	return r | (g << 8) | (b << 16);
}

function RGBStringToRGB(hex) {
	const r = parseInt(hex.slice(1, 3), 16),
		g = parseInt(hex.slice(3, 5), 16),
		b = parseInt(hex.slice(5, 7), 16);
	return b | (g << 8) | (r << 16);
}

function BGRToRGB(dColor) {
	return RGBStringToRGB(BGRToRGBString(dColor));
}

function DECToBIN(dec) {
	return (dec >>> 0).toString(2);
}

function getIntersectPoint(p1, p2, p3, p4) {
	// Tentukan persamaan garis pertama
	let m1, b1;
	if (p2.x - p1.x === 0) {
		m1 = null;
		b1 = p1.x;
	} else if (p2.y - p1.y === 0) {
		m1 = 0;
		b1 = p1.y;
	} else {
		m1 = (p2.y - p1.y) / (p2.x - p1.x);
		b1 = p1.y - m1 * p1.x;
	}

	// Tentukan persamaan garis kedua
	let m2, b2;
	if (p4.x - p3.x === 0) {
		m2 = null;
		b2 = p3.x;
	} else if (p4.y - p3.y === 0) {
		m2 = 0;
		b2 = p3.y;
	} else {
		m2 = (p4.y - p3.y) / (p4.x - p3.x);
		b2 = p3.y - m2 * p3.x;
	}

	// Hitung titik potong
	let x, y;
	if (m1 == null && m1 == 0) {
		x = b1;
		y = b2;
	} else if (m1 == 0 && m2 == null) {
		x = b2;
		y = b1;
	} else if (m1 == null) {
		x = b1;
		y = m2 * x + b2;
	} else if (m2 == null) {
		x = b2;
		y = m1 * x + b1;
	} else if (m1 == 0) {
		y = b1;
		x = (y - b2) / m2;
	} else if (m2 == 0) {
		y = b2;
		x = (y - b1) / m1;
	} else {
		x = (b2 - b1) / (m1 - m2);
		y = m1 * x + b1;
	}

	return new Point(x, y);
}
