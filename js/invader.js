// constsnts
/**
 * @const Frame Per Second
 */
var FPS = 30;
var ALIEN_ROW_MAX = 4;
var ALIEN_COL_MAX = 12;
var FIELD_WIDTH = 600;
var FIELD_HEIGHT = 400;

var INPUT_KEY_LEFT = 37;
var INPUT_KEY_RIGHT = 39;
var INPUT_KEY_SHIFT = 16;
var _input_key = 0;

// (w, h) = (22, 16) 1 row 2 column
var alien_image = new Image();
alien_image.src = "img/alien.png";
alien_image.width = 22;
alien_image.height = 16;
// (w, h) = (5, 20) 1 row 1 column
var alien_attack_image = new Image();
alien_attack_image.src = "img/beam.png";
alien_attack_image.width = 5;
alien_attack_image.height = 20;
// (w, h) = (20, 20) 1 row 1 column
var player_image = new Image();
player_image.src = "img/player.png";
player_image.width = 20;
player_image.height = 20;
// (w, h) = 
player_attack_image = new Image();
player_attack_image.src = "img/shot.png";
player_attack_image.width = 2;
player_attack_image.height = 20;

function getKeyCode() {
  return _input_key;
}

var Beam = function(x, y) {
  this.x = x;
  this.y = y;
  this.r = alien_attack_image.width / 2;
  this.speed = 10;
  this.is_active = true;
  this.update = function() {
    this.y += this.speed;
  };
  this.render = function(context) {
    if ( this.is_active ) {
      var dx = this.x - alien_attack_image.width / 2;
      var dy = this.y - alien_attack_image.height / 2;
      context.save();
      context.drawImage(alien_attack_image, dx, dy);
      context.restore();
    }
  };
}

/**
 * Alien Class
 * @param {double} x Alien's x coordinate position.
 * @param {double} y Alien's y coordinate position.
 */
var Alien = function(x, y) {
  this.x = x;
  this.y = y;
  this.vx = 0.6;
  this.vy = 0;
  this.r = 5;
  this.life_count = 0;
  this.is_active = true;
  this.beams = [];
  this.update = function() {
    // attack
    if ( this.is_active && Math.random() < 0.001 ) {
      this.attack();
    }
    for ( var i = 0; i < this.beams.length; ++i ) {
      this.beams[i].update();
    }
    // move
    this.x += this.vx;
    this.y += this.vy;
    ++this.life_count;
  };
  this.attack = function() {
    this.beams.push(new Beam(this.x, this.y));
  };
  /**
   * @param {Context} context
   */
  this.render = function(context) {
    for ( var i = 0; i < this.beams.length; ++i ) {
      this.beams[i].render(context);
    }
    if ( this.is_active ) {
      var sw = 22;
      var sh = 16;
      var sx = ( Math.floor(this.life_count / FPS) % 2 == 0 ) ? sw : 0;
      var sy = 0;
      var dx = this.x - sw / 2;
      var dy = this.y - sh / 2;
      var dw = sw;
      var dh = sh;
      context.save();
      context.drawImage(alien_image, sx, sy, sw, sh, dx, dy, dw, dh);
      context.restore();
    }
  };
};

var Bullet = function(x, y) {
  this.x = x;
  this.y = y;
  this.r = player_attack_image.width / 2;
  this.is_active = true;
  this.speed = 10;
  this.update = function() {
    this.y -= this.speed;
  };
  this.render = function(context) {
    if ( this.is_active ) {
      context.save();
      context.drawImage(player_attack_image, this.x, this.y);
      context.restore();
    }
  };
}

var Player = function() {
  this.x = FIELD_WIDTH / 2;
  this.y = FIELD_HEIGHT * 0.9;
  this.r = player_image.width / 2;
  this.cool_down = 0;
  this.reload_time = 5;
  this.speed = 1.6;
  this.bullets = [];
  this.is_active = true;
  this.attack = function() {
    if ( this.cool_down <= 0 ) {
      this.bullets.push(new Bullet(this.x, this.y));
      this.cool_down = this.reload_time;
    }
  };
  this.update = function() {
    switch ( getKeyCode() ) {
      case INPUT_KEY_LEFT:
        this.vx = -this.speed;
        break;
      case INPUT_KEY_RIGHT:
        this.vx = this.speed;
        break;
      case INPUT_KEY_SHIFT:
        this.attack();
        break;
      default: this.vx = 0;
    }
    for ( var i = 0; i < this.bullets.length; ++i ) {
      this.bullets[i].update();
    }
    --this.cool_down;
    this.x += this.vx;
  };
  this.render = function(context) {
    for ( var i = 0; i < this.bullets.length; ++i ) {
      this.bullets[i].render(context);
    }
    if ( this.is_active ) {
      context.save();
      context.drawImage(player_image, this.x - player_image.width / 2, this.y - player_image.height / 2);
      context.restore();
    }
  };
};

function isCollision(sx, sy, sr, tx, ty, tr) {
  var dx = sx - tx;
  var dy = sy - ty;
  var dr = sr + tr;
  return ( dr*dr > dx*dx + dy*dy );
};

/**
 * Initialize Aliens
 */
function initAliens() {
  var result = [];
  for ( var r = 0; r < ALIEN_ROW_MAX; ++r ) {
    for ( var c = 0; c < ALIEN_COL_MAX; ++c ) {
      result.push(new Alien(10 + 32 * c, 30 + 32 * r));
    }
  }
  return result;
};

$(function(){
  var canvas = document.getElementById("field");
  var context = canvas.getContext("2d");
  var frame_count = 0;
  var aliens = initAliens();
  var player = new Player();
  setInterval(main, 1000 / FPS);

  function isEdge() {
    var margin = 5;
    for ( var i = 0; i < aliens.length; ++i ) {
      var tx = aliens[i].x;
      if ( tx + alien_image.width + margin > FIELD_WIDTH || tx - margin < 0 ) {
        return true;
      }
    }
    return false;
  };

  function update() {
    // Update Aliens
    for ( var i = 0; i < aliens.length; ++i ) {
      aliens[i].update();
    }
    if ( isEdge() ) { // 端まで到達したエイリアンがいれば，一段下がり向きを変更
      for ( var i = 0; i < aliens.length; ++i ) {
        aliens[i].y += 30;
        aliens[i].vx *= -1;
      }
    }
    // Update Player
    player.update();
    // エイリアンの攻撃がプレイヤーに当たっているか判定する．alien_attack.hit(player)
    for ( var i = 0; i < aliens.length; ++i ) if ( aliens[i].is_active ) {
      for ( var j = 0; j < aliens[i].beams.length; ++j ) if ( aliens[i].beams[j].is_active ) {
        var sx = player.x;
        var sy = player.y;
        var sr = player.r;
        var tx = aliens[i].beams[j].x;
        var ty = aliens[i].beams[j].y;
        var tr = aliens[i].beams[j].r;
        if ( isCollision(sx, sy, sr, tx, ty, tr) ) {
          player.is_active = false;
          aliens[i].beams[j].is_active = false;
        }
      }
    }
    // プレイヤーの攻撃がエイリアンに当たっているか判定する．player_attack.hit(alien)
    for ( var i = 0; i < player.bullets.length; ++i ) if ( player.bullets[i].is_active ) {
      for ( var j = 0; j < aliens.length; ++j ) if ( aliens[j].is_active ) {
        var sx = player.bullets[i].x;
        var sy = player.bullets[i].y;
        var sr = player.bullets[i].r;
        var tx = aliens[j].x;
        var ty = aliens[j].y;
        var tr = aliens[j].r;
        if ( isCollision(sx, sy, sr, tx, ty, tr) ) {
          aliens[j].is_active = false;
          player.bullets[i].is_active = false;
        }
      }
    }
  };

  function render(context) {
    context.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
    // Render Aliens.
    for ( var i = 0; i < aliens.length; ++i ) {
      aliens[i].render(context);
    }
    // Render Player.
    player.render(context);
  };

  window.document.onkeydown = function(event) {
    _input_key = event.keyCode;
  };
  window.document.onkeyup = function(event) {
    _input_key = 0;
  };

  function main() {
    update();
    render(context);
    ++frame_count;
  };
});


