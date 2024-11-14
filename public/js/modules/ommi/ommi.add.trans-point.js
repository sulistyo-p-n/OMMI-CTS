class TransPointObject extends GroupObject {
	constructor() {
		super();

		this.configs["label"] = "";
		this.configs["diameter"] = 20;
		this.configs["angle"] = 0.0;

		this.areaObject = new EllipseObject();
		this.baseObjects.push(this.areaObject);

		this.pointObject = new EllipseObject();
		this.baseObjects.push(this.pointObject);

		this.textObject = new RectObject();
		this.baseObjects.push(this.textObject);

		this.setVariables();
	}

	setVariables() {
		const variable = new Variable();
		variable.name = "STATUS";
		variable.value = 0;
		this.variables.push(variable);
	}

	setObjects() {
		this.setAreaObject();
		this.setPointObject();
		this.setTextObject();
	}

	setAreaObject() {
		this.areaObject.baseStyle.isUseFill = true;

		this.areaObject.baseStyle.isUseLine = false;

		this.areaObject.baseStyle.isUseText = false;

		this.areaObject.w = this.configs["diameter"] * 2;
		this.areaObject.h = this.configs["diameter"] * 2;

		this.areaObject.anchor.h = 0.5;
		this.areaObject.anchor.v = 0.5;
		this.areaObject.point.x = 0.0;
		this.areaObject.point.y = 0.0;

		this.areaObject.tag = "heat";

		let variable = new Variable();
		for (const currentVar of this.variables) {
			if (currentVar.name == "STATUS") {
				variable = currentVar;
				break;
			}
		}

		let mark;
		this.areaObject.marks = [];

		mark = new Mark();
		mark.variable.variable = variable;
		mark.variable.comparation = Comparation.EqualTo;
		mark.variable.activeValue = 0;
		mark.style = this.areaObject.baseStyle.clone();
		mark.style.fillColor = 0x0000ff;
		mark.style.scale = 1.0;
		this.areaObject.marks.push(mark);

		mark = new Mark();
		mark.variable.variable = variable;
		mark.variable.comparation = Comparation.EqualTo;
		mark.variable.activeValue = 1;
		mark.style = this.areaObject.baseStyle.clone();
		mark.style.fillColor = 0x00ff00;
		mark.style.scale = 1.0;
		this.areaObject.marks.push(mark);

		mark = new Mark();
		mark.variable.variable = variable;
		mark.variable.comparation = Comparation.EqualTo;
		mark.variable.activeValue = 2;
		mark.style = this.areaObject.baseStyle.clone();
		mark.style.fillColor = 0xffff00;
		mark.style.scale = 5 / 4;
		this.areaObject.marks.push(mark);

		mark = new Mark();
		mark.variable.variable = variable;
		mark.variable.comparation = Comparation.EqualTo;
		mark.variable.activeValue = 3;
		mark.style = this.areaObject.baseStyle.clone();
		mark.style.fillColor = 0xffa500;
		mark.style.scale = 6 / 4;
		this.areaObject.marks.push(mark);

		mark = new Mark();
		mark.variable.variable = variable;
		mark.variable.comparation = Comparation.EqualTo;
		mark.variable.activeValue = 4;
		mark.style = this.areaObject.baseStyle.clone();
		mark.style.fillColor = 0xff0000;
		mark.style.scale = 7 / 4;
		this.areaObject.marks.push(mark);
	}

	setPointObject() {
		this.pointObject.baseStyle.isUseFill = true;
		this.pointObject.baseStyle.fillColor = 0xffffff;

		this.pointObject.baseStyle.isUseLine = true;
		this.pointObject.baseStyle.lineSize = 2;
		this.pointObject.baseStyle.lineColor = 0x000000;

		this.pointObject.baseStyle.isUseText = false;

		this.pointObject.w = this.configs["diameter"];
		this.pointObject.h = this.configs["diameter"];

		this.pointObject.anchor.h = 0.5;
		this.pointObject.anchor.v = 0.5;
		this.pointObject.point.x = 0.0;
		this.pointObject.point.y = 0.0;

		this.pointObject.tag = "point";

		let variable = new Variable();
		for (const currentVar of this.variables) {
			if (currentVar.name == "STATUS") {
				variable = currentVar;
				break;
			}
		}

		let mark;
		this.pointObject.marks = [];

		mark = new Mark();
		mark.variable.variable = variable;
		mark.variable.comparation = Comparation.EqualTo;
		mark.variable.activeValue = 0;
		mark.style = this.pointObject.baseStyle.clone();
		mark.style.fillColor = 0x0000ff;
		this.pointObject.marks.push(mark);
	}

	setTextObject() {
		this.textObject.baseStyle.isUseFill = false;

		this.textObject.baseStyle.isUseLine = false;

		this.textObject.baseStyle.isUseText = true;
		this.textObject.baseStyle.text = this.configs["label"];
		this.textObject.baseStyle.fontSize = this.configs["diameter"];
		this.textObject.baseStyle.textAnchor.h = 0.0;
		this.textObject.baseStyle.textAnchor.v = 0.5;
		this.textObject.baseStyle.isReadable = true;

		this.textObject.w = this.configs["diameter"] * 5;
		this.textObject.h = this.configs["diameter"];

		this.textObject.anchor.h = -0.5;
		this.textObject.anchor.v = 0.5;
		this.textObject.point.x = 0.0;
		this.textObject.point.y = 0.0;

		this.textObject.a = this.configs["angle"];

		this.textObject.tag = "label";
	}
}
