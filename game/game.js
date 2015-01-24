(function(exports) {

var field;
var heroes;
var mainHero, secondHero;

var cellWidth = 32;
var cellHeight = 32;

var heroImageWidth = 64;
var heroImageHeight = 64;
var heroImageFramesCount = 9;
var heroAnimSpeed = 8;
var heroOffsetX = (heroImageWidth - cellWidth) * 0.5;
var heroOffsetY = 33;

var fieldWidth, fieldHeight;
var cells = null;

var cellTypes = ".xf";
var typesToStyles = {
	'.': 'empty',
	'x': 'wall',
	'f': 'fire'
};

var editMode = true;

function directionNumber(dx, dy) {
	if(dx == 1) return 3;
	if(dx == -1) return 1;
	if(dy == 1) return 2;
	return 0;
}

function Hero() {
	this.x = 0;
	this.y = 0;
	this.div = $("<div>").addClass("hero").css({
		width: heroImageWidth,
		height: heroImageHeight
	});
	this.direction = 2;
};
Hero.prototype.setPosition = function(x, y, anim, plus) {
	this.x = x;
	this.y = y;
	var o = {
		left: x * cellWidth - heroOffsetX,
		top: y * cellHeight - heroOffsetY
	};
	if(anim) {
		var self = this;
		this.div.finish();
		if(plus) this.reorder();
		this.div.animate(o, {
			duration: 100,
			progress: function(animation, progress) {
				self.div.css("backgroundPosition", (-((Math.floor(progress * heroAnimSpeed)) % heroImageFramesCount) * heroImageWidth) + "px " + (-self.direction * heroImageHeight) + "px");
			}
		});
		if(!plus) this.queueReorder();
	} else {
		this.div.css(o);
	}
};
Hero.prototype.reorder = function() {
	this.div.insertAfter(cells[this.y][this.x].div);
};
Hero.prototype.queueReorder = function() {
	var self = this;
	this.div.queue(function() {
		self.reorder();
	});
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
		var plus = dx > 0 || dy > 0;
		var xx = this.x + dx;
		var yy = this.y + dy;
		var xxx = xx + dx;
		var yyy = yy + dy;
		var iceDiv = cells[yy][xx].iceDiv;
		if(iceDiv) {
			iceDiv.finish();
			if(plus)
				iceDiv.insertAfter(cells[yyy][xxx].div);
			iceDiv.animate({
				left: xxx * cellWidth,
				top: yyy * cellHeight
			}, 100);
			if(!plus)
				iceDiv.queue(function() {
					iceDiv.insertAfter(cells[yyy][xxx].div);
				});
			if(cells[yyy][xxx].type == 'f') {
				cells[yyy][xxx].type = '.';
				cells[yyy][xxx].div.removeClass("fire").addClass("empty");
				iceDiv.fadeOut(100);
			} else {
				cells[yyy][xxx].iceDiv = iceDiv;
			}
			cells[yy][xx].iceDiv = null;
		}
		this.direction = directionNumber(dx, dy);
		this.setPosition(xx, yy, true, plus);
	} else {
		this.showTry(dx, dy);
	}
};
Hero.prototype.showTry = function(dx, dy) {
	this.div.finish().animate({
		left: (this.x + dx * 0.2) * cellWidth - heroOffsetX,
		top: (this.y + dy * 0.2) * cellHeight - heroOffsetY
	}, 50).animate({
		left: this.x * cellWidth - heroOffsetX,
		top: this.y * cellHeight - heroOffsetY
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
					iceDiv = $("<div>").addClass("ice").css({
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
				if(iceDiv)
					iceDiv.insertAfter(div);
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
		heroes[i].div.insertAfter(cells[heroes[i].y][heroes[i].x].div);
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
