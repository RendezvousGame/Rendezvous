var current_level = 0;
var playAsGuy = true;
var sound = true;

jQuery(function($){
  
  $("#play-button").click(function(){
    $("#field").fadeOut(function(){
      $("#field").new_level(current_level);
    });
  });
  
  $("#toggleSound").click(function(){
    if(sound) {
      sound = false;
      window.play_music(null);
      $(this).find(".fa").removeClass("fa-volume-up").addClass("fa-volume-off");
    } else {
      sound = true;
      window.play_music("intro");
      $(this).find(".fa").removeClass("fa-volume-off").addClass("fa-volume-up");
    }
  });
  
  
  $('#char-select div.hero').on({
    click: function() {
      $(this).parent().find("div.hero").removeClass("active").animate({opacity: 0.4});
      $(this).addClass("active").animate({opacity: 1});
      if(playAsGuy) {
        playAsGuy = false;
      } else {
        playAsGuy = true;
      }
    }, mouseenter: function() {
      if(!$(this).hasClass("active")) $(this).animate({opacity: 0.8});
    }, mouseleave: function() {
      if(!$(this).hasClass("active")) $(this).animate({opacity: 0.4});
    }
  });
  
  $(document).on('click','.restart', function() {
    $("#field").fadeOut(function(){
      createField(levels[current_level], playAsGuy);
    });
  });
  
  $(document).on('click','#new-level', function() {
    $("#field").fadeOut(function(){
      if(current_level + 1 > levels.length) current_level = 0
      $("#field").new_level(current_level);
    });
  });
  
  $(document).on('click','#next-level', function() {
    $("#field").fadeOut(function(){
      if(current_level + 1 < levels.length) {
        createField(levels[++current_level], playAsGuy);
      } else {
        current_level = 0
        createField(levels[current_level], playAsGuy);
      }
    });
  });
  
});

$.fn.level_complete = function() {
  jQuery(function($){
    $("#retry").fadeOut().remove();
    var html = '<div id="start-screen"><div class="darken"><h4>What do we do next?</h4><a href="#" onclick="return false;" title="Replay" id="restart-level" class="restart button button-error">Replay Level</a><a href="#" onclick="return false;" title="Play" id="new-level" class="button button-success">Next Level?</a></div></div>';
    $("#field").delay(500).fadeOut(function(){
      $("#field").width("100%").height("100%").html(html).css({
        'position' : 'absolute',
        'left' : '50%',
        'top' : '50%',
        'margin-left' : -$(this).width()/2,
        'margin-top' : -$(this).height()/2
      }).fadeIn();
    });
  });
}

$.fn.new_level = function(level) {
  jQuery(function($){
    var html = '<div id="start-screen"><div class="darken"><h4>Level ' + (level + 1) + '</h4></div></div>';
    $("#field").fadeOut(function(){
      $("#field").width("100%").height("100%").html(html).css({
        'position' : 'absolute',
        'left' : '50%',
        'top' : '50%',
        'margin-left' : -$(this).width()/2,
        'margin-top' : -$(this).height()/2
      }).fadeIn(function(){
        $('<a href="#" onclick="return false;" title="Play" id="next-level" class="button button-primary">Play</a>').hide().appendTo("#start-screen .darken").fadeIn();
      });
    });
  });
}



window.audio = new Audio();
audio.setAttribute("loop", "loop");

function play_music(sound) {
  
  mySound = "";
  
  switch(sound) {
    case "intro": 
      sound = "AboutScene.mp3";
      break;
    case "gameplay":
      sound = "Andante.mp3";
      break;
    case null:
      audio.pause();
      return false;
      break;
  }

  audio.setAttribute("src","audio/" + sound);

  audio.load(); //call this to just preload the audio without playing
  audio.play(); //call this to play the song right away
}



;(function(exports) {  
  

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

window.editMode = window.location.pathname.indexOf("/game.html") >= 0;

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
				self.updateDirection(progress);
			}
		});
		if(!plus) this.queueReorder();
	} else {
		this.div.css(o);
	}
};
Hero.prototype.updateDirection = function(progress) {
	this.div.css("backgroundPosition", (-((Math.floor(progress * heroAnimSpeed)) % heroImageFramesCount) * heroImageWidth) + "px " + (-this.direction * heroImageHeight) + "px");
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
			if(xxx >= 0 && xxx < fieldWidth && yyy >= 0 && yyy < fieldHeight && (cells[yyy][xxx].type == '.' || cells[yyy][xxx].type == 'f') && !cells[yyy][xxx].iceDiv && !isHeroThere(xxx, yyy))
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
			var o = {
				left: xxx * cellWidth,
				top: yyy * cellHeight
			};
			if(cells[yyy][xxx].type == 'f') {
				cells[yyy][xxx].type = '.';
				cells[yyy][xxx].div.removeClass("fire").addClass("empty");
				o.opacity = 0;
			} else {
				cells[yyy][xxx].iceDiv = iceDiv;
			}
			iceDiv.animate(o, 100);
			if(!plus)
				iceDiv.queue(function() {
					iceDiv.insertAfter(cells[yyy][xxx].div);
				});
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

function isHeroThere(x, y) {
	return mainHero.x == x && mainHero.y == y || secondHero.x == x && secondHero.y == y;
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
	window.play_music("intro");

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
	if(!mainHero || !secondHero)
		return;

	var mainHeroCanMove = mainHero.canMove(dx, dy);
	var secondHeroCanMove = secondHero.canMove(-dx, -dy);
	if(mainHeroCanMove && secondHeroCanMove) {
		// check final condition
		if(mainHero.canGo(dx, dy) && secondHero.canGo(-dx, -dy)) {
			var px = secondHero.x - mainHero.x;
			var py = secondHero.y - mainHero.y;
			if(Math.abs(px) <= 2 && Math.abs(py) <= 2 && Math.sign(dx) == Math.sign(px) && Math.sign(dy) == Math.sign(py)) {
				// final!
				var rx = mainHero.x + px * 0.5;
				var ry = mainHero.y + py * 0.5;
				var k = 0.3;
				mainHero.direction = directionNumber(dx, dy);
				secondHero.direction = directionNumber(-dx, -dy);
				mainHero.updateDirection(0);
				secondHero.updateDirection(0);
				mainHero.div.finish().animate({
					left: (rx - dx * k) * cellWidth - heroOffsetX,
					top: (ry - dy * k) * cellHeight - heroOffsetY
				}, 100);
				secondHero.div.finish().animate({
					left: (rx + dx * k) * cellWidth - heroOffsetX,
					top: (ry + dy * k) * cellHeight - heroOffsetY
				}, 100);

				mainHero.div.css("zIndex", 2);
				secondHero.div.css("zIndex", 2);

				$("<div>").addClass("final").hide().appendTo(field).fadeIn(2000, function(){
  				window.play_music("intro");
  				$("body").level_complete();
				});

				mainHero = null;
				secondHero = null;
				return;
			}
		}

		mainHero.go(dx, dy);
		secondHero.go(-dx, -dy);

	} else {
		if(!mainHeroCanMove)
			mainHero.showTry(dx, dy);
		if(!secondHeroCanMove)
			secondHero.showTry(-dx, -dy);
	}
};

exports.createField = function createField(scheme, playForGuy) {
	field.empty();
	window.play_music("gameplay");

	fieldWidth = scheme[0].length;
	fieldHeight = scheme.length;

	field.css({
		width: fieldWidth * cellWidth,
		height: fieldHeight * cellHeight,
		position: 'absolute',
    left: '50%',
    top: '50%',
    'margin-left': -(fieldWidth * cellWidth)/2,
    'margin-top': -(fieldHeight * cellHeight)/2
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
					heroes[0].div.addClass("soldier");
					heroes[0].setPosition(j, i, false);
					type = '.';
				}
				else if(scheme[i][j] == 'B') {
					heroes[1] = new Hero();
					heroes[1].div.addClass("princess");
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

				var div = $("<div>").appendTo(field).addClass("cell").addClass(typesToStyles[type]).addClass("texture" + (Math.floor(Math.random() * 3) + 1)).addClass("addon" + (Math.floor(Math.random() * 25) + 1)).css({
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

	if(playForGuy) {
		mainHero = heroes[0];
		secondHero = heroes[1];
	} else {
		mainHero = heroes[1];
		secondHero = heroes[0];
	}
	mainHero.main = true;

	for(var i = 0; i < heroes.length; ++i)
		heroes[i].div.insertAfter(cells[heroes[i].y][heroes[i].x].div);
		
  field.fadeIn();
  
  $("#retry").fadeOut().remove();
  $('<a href="#" onclick="return false;" title="Replay Level" id="retry" class="restart button button-error button-small">Reset</a>').hide().appendTo('body').css({
    position: 'absolute',
    bottom: '20px',
    right: '10px'
  }).delay(10000).fadeIn('slow');
  
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
	types[mainHero.y][mainHero.x] = mainHero.div.hasClass("soldier") ? 'A' : 'B';
	types[secondHero.y][secondHero.x] = secondHero.div.hasClass("soldier") ? 'A' : 'B';
	var s = "[\n";
	for(var i = 0; i < cells.length; ++i) {
		s += "\t\"" + types[i].join("") + "\",\n";
	}
	s += "],\n";
	return s;
};



})(window);
