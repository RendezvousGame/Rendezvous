(function(exports) {

var field;
var heroes;
var mainHero, secondHero;

var cellWidth = 40;
var cellHeight = 40;

var fieldWidth, fieldHeight;
var cells = null;

var typesToStyles = {
	'.': 'empty',
	'x': 'wall'
};

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
		this.div.animate(o, 100);
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
	return (cell.type == '.');
};
Hero.prototype.canMove = function(dx, dy) {
	var xx = this.x + dx;
	var yy = this.y + dy;
	if(xx < 0 || xx >= fieldWidth || yy < 0 || yy >= fieldHeight)
		return false;
	var cell = cells[yy][xx];
	return (cell.type == '.' || cell.type == 'x');
};
Hero.prototype.go = function(dx, dy) {
	if(this.canGo(dx, dy)) {
		this.setPosition(this.x + dx, this.y + dy, true);
	} else {
		this.showTry(dx, dy);
	}
};
Hero.prototype.showTry = function(dx, dy) {
	this.div.animate({
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
			var type = scheme[i][j];

			if(scheme[i][j] == 'A') {
				heroes[0] = new Hero();
				heroes[0].div.addClass("hero1");
				heroes[0].setPosition(j, i, false);
				type = '.';
			}
			if(scheme[i][j] == 'B') {
				heroes[1] = new Hero();
				heroes[1].div.addClass("hero2");
				heroes[1].setPosition(j, i, false);
				type = '.';
			}

			var div = $("<div>").appendTo(field).addClass("cell").addClass(typesToStyles[type]).css({
				left: j * cellWidth,
				top: i * cellHeight,
				width: cellWidth,
				height: cellHeight
			});
			row.push(new Cell(j, i, type, div));

		}
		cells.push(row);
	}

	mainHero = heroes[0];
	secondHero = heroes[1];

	for(var i = 0; i < heroes.length; ++i)
		heroes[i].div.appendTo("#field");
}

})(window);
