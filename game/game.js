(function(exports) {

var field;
var heroes;
var mainHero, secondHero;

var cellWidth = 40;
var cellHeight = 40;

var fieldWidth, fieldHeight;
var cells = null;

var cellTypes = ".xf";
var typesToStyles = {
	'.': 'empty',
	'x': 'wall',
	'f': 'fire'
};

var editMode = true;

function Hero() {
	this.x = 0;
	this.y = 0;
	this.div = $("<div>").addClass("hero");
};
Hero.prototype.setPosition = function(x, y, anim) {
	this.x = x;
	this.y = y;
	var o = {
		left: x * cellWidth,
		top: y * cellHeight,
		width: cellWidth,
		height: cellHeight
	};
	if(anim) {
		this.div.finish().animate(o, 100);
	} else {
		this.div.css(o);
	}
};
Hero.prototype.canGo = function(dx, dy) {
	var xx = this.x + dx;
	var yy = this.y + dy;
	if(xx < 0 || xx >= fieldWidth || yy < 0 || yy >= fieldHeight)
		return false;
	var cell = cells[yy][xx];
	if(cell.type == '.') {
		if(cell.iceDiv) {
			var xxx = xx + dx;
			var yyy = yy + dy;
			if(xxx >= 0 && xxx < fieldWidth && yyy >= 0 && yyy < fieldHeight && (cells[yyy][xxx].type == '.' || cells[yyy][xxx].type == 'f') && !cells[yyy][xxx].iceDiv)
				return true;
			return false;
		}
		return true;
	}
	return false;
};
Hero.prototype.canMove = function(dx, dy) {
	var xx = this.x + dx;
	var yy = this.y + dy;
	if(xx < 0 || xx >= fieldWidth || yy < 0 || yy >= fieldHeight)
		return true;
	var cell = cells[yy][xx];
	return (cell.type == '.' || cell.type == 'x');
};
Hero.prototype.go = function(dx, dy) {
	if(this.canGo(dx, dy)) {
		var iceDiv = cells[this.y + dy][this.x + dx].iceDiv;
		if(iceDiv) {
			iceDiv.animate({
				left: (this.x + dx * 2) * cellWidth,
				top: (this.y + dy * 2) * cellHeight
			}, 100);
			if(cells[this.y + dy * 2][this.x + dx * 2].type == 'f') {
				cells[this.y + dy * 2][this.x + dx * 2].type = '.';
				cells[this.y + dy * 2][this.x + dx * 2].div.removeClass("fire").addClass("empty");
				iceDiv.fadeOut(100);
			} else {
				cells[this.y + dy * 2][this.x + dx * 2].iceDiv = iceDiv;
			}
			cells[this.y + dy][this.x + dx].iceDiv = null;
		}
		this.setPosition(this.x + dx, this.y + dy, true);
	} else {
		this.showTry(dx, dy);
	}
};
Hero.prototype.showTry = function(dx, dy) {
	this.div.finish().animate({
		left: (this.x + dx * 0.2) * cellWidth,
		top: (this.y + dy * 0.2) * cellHeight
	}, 50).animate({
		left: this.x * cellWidth,
		top: this.y * cellHeight
	}, 50);
};

function Cell(x, y, type, div) {
	this.x = x;
	this.y = y;
	this.div = div;
	this.type = type;
	this.iceDiv = null;
};

exports.init = function init() {
	field = $("#field");

	$(document).keydown(function(e) {
		switch(e.which) {
		case 38: // up
		case 87: // W
			move(0, -1);
			break;
		case 39: // right
		case 68: // D
			move(1, 0);
			break;
		case 37: // left
		case 65: // A
			move(-1, 0);
			break;
		case 40: // down
		case 83: // S
			move(0, 1);
			break;
		default:
			return;
		}
		e.preventDefault();
	});
};

function move(dx, dy) {
	if(mainHero.canMove(dx, dy) && secondHero.canMove(-dx, -dy)) {
		mainHero.go(dx, dy);
		secondHero.go(-dx, -dy);
	} else {
		mainHero.showTry(dx, dy);
		secondHero.showTry(-dx, -dy);
	}
};

exports.createField = function createField(scheme) {
	field.empty();

	fieldWidth = scheme[0].length;
	fieldHeight = scheme.length;

	field.css({
		width: fieldWidth * cellWidth,
		height: fieldHeight * cellHeight
	});

	cells = [];
	heroes = [null, null];
	for(var i = 0; i < fieldHeight; ++i) {
		var row = [];
		for(var j = 0; j < fieldWidth; ++j) {
			(function() {
				var type = scheme[i][j];
				var iceDiv = null;

				if(scheme[i][j] == 'A') {
					heroes[0] = new Hero();
					heroes[0].div.addClass("hero1");
					heroes[0].setPosition(j, i, false);
					type = '.';
				}
				else if(scheme[i][j] == 'B') {
					heroes[1] = new Hero();
					heroes[1].div.addClass("hero2");
					heroes[1].setPosition(j, i, false);
					type = '.';
				}
				else if(scheme[i][j] == 'i') {
					iceDiv = $("<div>").appendTo(field).addClass("ice").css({
						left: j * cellWidth,
						top: i * cellHeight,
						width: cellWidth,
						height: cellHeight
					});
					type = '.';
				}

				var div = $("<div>").appendTo(field).addClass("cell").addClass(typesToStyles[type]).css({
					left: j * cellWidth,
					top: i * cellHeight,
					width: cellWidth,
					height: cellHeight
				});
				var cell = new Cell(j, i, type, div);
				cell.iceDiv = iceDiv;
				row.push(cell);

				if(editMode) {
					div.click(function() {
						div.removeClass(typesToStyles[cell.type]);
						var q = cellTypes.indexOf(cell.type);
						q++;
						if(q >= cellTypes.length)
							q = 0;
						cell.type = cellTypes[q];
						cell.div.addClass(typesToStyles[cell.type]);
					});
				}
			})();
		}
		cells.push(row);
	}

	mainHero = heroes[0];
	secondHero = heroes[1];

	for(var i = 0; i < heroes.length; ++i)
		heroes[i].div.appendTo("#field");
}

exports.saveField = function saveField() {
	var types = [];
	for(var i = 0; i < cells.length; ++i) {
		var row = [];
		for(var j = 0; j < cells[i].length; ++j) {
			row.push(cells[i][j].iceDiv ? 'i' : cells[i][j].type);
		}
		types.push(row);
	}
	types[mainHero.y][mainHero.x] = 'A';
	types[secondHero.y][secondHero.x] = 'B';
	var s = "[\n";
	for(var i = 0; i < cells.length; ++i) {
		s += "\t\"" + types[i].join("") + "\",\n";
	}
	s += "],\n";
	return s;
};

})(window);
