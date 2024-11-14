class TransLineObject extends GroupObject {
	constructor() {
		super();

		this.configs["diameter"] = 20;
		this.configs["joins"] = [];

		this.lineObject = new LineObject();
		this.baseObjects.push(this.lineObject);

		this.setVariables();
		this.setObjects();
	}

	setVariables() {
		let variable;

		variable = new Variable();
		variable.name = "STATUS-1";
		variable.value = 0;
		this.variables.push(variable);

		variable = new Variable();
		variable.name = "STATUS-2";
		variable.value = 0;
		this.variables.push(variable);
	}

	setObjects() {
		this.setLineObject();
	}

	setLineObject() {
		this.lineObject.baseStyle.isUseFill = true;
		this.lineObject.baseStyle.fillType = ColorType.Solid;
		this.lineObject.baseStyle.fillColor = 0x666666;
		this.lineObject.baseStyle.fillAlpha = 1.0;

		this.lineObject.baseStyle.isUseLine = false;

		this.lineObject.baseStyle.isUseText = false;

		this.lineObject.d = this.configs["diameter"];

		this.lineObject.point.x = 0.0;
		this.lineObject.point.y = 0.0;

		this.lineObject.joins = [];
		for (const join of this.configs["joins"]) {
			this.lineObject.joins.push(new Point(join.x, join.y));
		}

		this.lineObject.tag = "line";

		let variable1 = new Variable();
		let variable2 = new Variable();
		for (const currentVar of this.variables) {
			if (currentVar.name == "STATUS-1") {
				variable1 = currentVar;
			}
			if (currentVar.name == "STATUS-2") {
				variable2 = currentVar;
			}
		}

		this.lineObject.marks = [];

		for (let i = 0; i <= 4; i++) {
			for (let j = 0; j <= 4; j++) {
				const mark = new Mark();
				mark.variable = [];

				const checkVariable1 = new CheckVariable();
				checkVariable1.variable = variable1;
				checkVariable1.comparation = Comparation.EqualTo;
				checkVariable1.activeValue = i;
				mark.variable.push(checkVariable1);

				const checkVariable2 = new CheckVariable();
				checkVariable2.variable = variable2;
				checkVariable2.comparation = Comparation.EqualTo;
				checkVariable2.activeValue = j;
				mark.variable.push(checkVariable2);

				mark.style = this.lineObject.baseStyle.clone();
				mark.style.scale = 1.0;
				mark.style.fillType =
					i == j ? ColorType.Solid : ColorType.Linear;
				mark.style.fillColor =
					i == j
						? this.getColor(i)
						: [this.getColor(i), this.getColor(j)];
				mark.style.fillAlpha = i == j ? 1.0 : [1.0, 1.0];
				this.lineObject.marks.push(mark);
			}
		}
	}

	getColor(index) {
		switch (index) {
			case 1:
				return 0x00ff00;
			case 2:
				return 0xffff00;
			case 3:
				return 0xffa500;
			case 4:
				return 0xff0000;
			default:
				return 0x0000ff;
		}
	}
}
