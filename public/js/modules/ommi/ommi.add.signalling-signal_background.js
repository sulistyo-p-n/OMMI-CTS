class SignalBackgroundObject extends DrawObject {
	constructor() {
		super();

		this.angle = 0.0;
		this.baseAspectCount = 2; // include emergency aspect
		this.isUseCFAspect = true;
		this.isUseShunterAspect = true;

		this.baseStyle.isUseFill = false;

		this.baseStyle.isUseLine = true;
		this.baseStyle.lineSize = 1.0;
		this.baseStyle.lineColor = 0xffffff;

		this.baseStyle.isUseText = true;
	}

	setShape(obj, scale) {
		let x = 0.0;
		let y = 0.0;
		let w = 0.0;
		let h = 0.0;

		y =
			(this.getHeight() / 2 - (this.getHeight() * (13 / 19)) / 2) *
				scale +
			(-this.getHeight() / 2) * scale;
		w = this.getHeight() * (3 / 19) * scale;
		h = this.getHeight() * (13 / 19) * scale;
		obj.drawRect(x + (-this.getWidth() / 2) * scale, y, w, h);
		x += w;

		if (
			this.isUseShunterAspect &&
			!(this.baseAspectCount > 0) &&
			!this.isUseCFAspect
		) {
			y =
				(this.getHeight() / 2 - (this.getHeight() * (3 / 19)) / 2) *
					scale +
				(-this.getHeight() / 2) * scale;
			w = this.getHeight() * (3 / 19) * scale;
			h = this.getHeight() * (3 / 19) * scale;
			obj.drawRect(x + (-this.getWidth() / 2) * scale, y, w, h);
			x += w;

			y = 0.0 + (-this.getHeight() / 2) * scale;
			w = this.getWidth() * scale - x;
			h = this.getHeight() * scale;
			obj.drawRoundedRect(
				x + (-this.getWidth() / 2) * scale,
				y,
				w,
				h,
				(this.getHeight() / 2) * scale
			);
			x += w;
		} else if (
			this.isUseShunterAspect &&
			(this.baseAspectCount > 0 || this.isUseCFAspect)
		) {
			y =
				(this.getHeight() / 2 - (this.getHeight() * (3 / 19)) / 2) *
					scale +
				(-this.getHeight() / 2) * scale;
			w = this.getHeight() * (3 / 19) * scale;
			h = this.getHeight() * (3 / 19) * scale;
			obj.drawRect(x + (-this.getWidth() / 2) * scale, y, w, h);
			x += w;

			y = 0.0 + (-this.getHeight() / 2) * scale;
			w = this.getHeight() * scale;
			h = this.getHeight() * scale;
			obj.drawRect(x + (-this.getWidth() / 2) * scale, y, w, h);
			x += w;
		}

		if (this.baseAspectCount > 0) {
			y =
				(this.getHeight() / 2 - (this.getHeight() * (3 / 19)) / 2) *
					scale +
				(-this.getHeight() / 2) * scale;
			w = this.getHeight() * (3 / 19) * scale;
			h = this.getHeight() * (3 / 19) * scale;
			obj.drawRect(x + (-this.getWidth() / 2) * scale, y, w, h);
			x += w;

			y = 0.0 + (-this.getHeight() / 2) * scale;
			w =
				this.getWidth() * scale -
				x -
				(this.isUseCFAspect
					? (this.getHeight() + this.getHeight() * (3 / 19)) * scale
					: 0.0);
			h = this.getHeight() * scale;
			obj.drawRoundedRect(
				x + (-this.getWidth() / 2) * scale,
				y,
				w,
				h,
				(this.getHeight() / 2) * scale
			);
			x += w;
		}

		if (this.isUseCFAspect) {
			y =
				(this.getHeight() / 2 - (this.getHeight() * (3 / 19)) / 2) *
					scale +
				(-this.getHeight() / 2) * scale;
			w = this.getHeight() * (3 / 19) * scale;
			h = this.getHeight() * (3 / 19) * scale;
			obj.drawRect(x + (-this.getWidth() / 2) * scale, y, w, h);
			x += w;

			y = 0.0 + (-this.getHeight() / 2) * scale;
			w = this.getHeight() * scale;
			h = this.getHeight() * scale;
			obj.drawRect(x + (-this.getWidth() / 2) * scale, y, w, h);
			x += w;
		}
	}

	reDraw(ori, w, h, scale) {
		super.reDraw(ori, w, h, scale);

		let currenPoint = new Point(
			ori.x + this.point.x * scale,
			ori.y + this.point.y * scale
		);
		let currentW = this.getWidth() * scale;
		let currentH = this.getHeight() * scale;

		this.obj.position.set(
			currenPoint.x + currentW / 2,
			currenPoint.y + currentH / 2
		);
		this.obj.rotation = Math.PI * 2 * (-this.angle / 360);
	}
}
