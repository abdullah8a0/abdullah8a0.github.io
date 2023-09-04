

// Image rotation
var image_el = document.querySelector("img.head-img");

images = [
  1, 2, 3, 4, 5, 6, 7, 8, 9
].map(function(i) {
  return "assets/img/" + i + "c.jpg";
});

function shuffle(array) {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}


updateimage = function() {
  images = shuffle(images);
  let setsrc = function(i) {
    image_el.src = images[i];
    setTimeout(function() {
      setsrc((i + 1) % images.length);
    }, 2000);
  }
  setsrc(0);
  setTimeout(updateimage, images.length * 2000);
};


if (!image_el || images.length == 0) {
  console.log("not showing images");
} else {
  updateimage();
}


var clamp = function(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

var sign = function(x) {
  if (x > 0) {
    return 1;
  } else if (x < 0) {
    return -1;
  } else {
    return 0;
  }
}

var collapse = function(val, min, ret, max) {
  if (val > min && val < max) {
    return ret;
  } else {
    return val;
  }
}


// rocket follow cursor

var rocket_el = document.querySelector("div.rocket");
var init_x = rocket_el.getBoundingClientRect().left + rocket_el.getBoundingClientRect().width / 2;
var init_y = rocket_el.getBoundingClientRect().top + rocket_el.getBoundingClientRect().height / 2;
init_x += window.scrollX;
init_y += window.scrollY;

var rocket = {
  x: init_x,
  y: init_y,
  vx: 0,
  vy: 0,
  ax: 0,
  ay: 0,
  theta: 0
};

var destination = [];

var updateAcceleration = function() {
  if (destination.length > 0) {
    var dest = destination[0];
    var dx = dest[0] - rocket.x;
    var dy = dest[1] - rocket.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d < 5) {
      destination.shift();
      // fade out
      dest[2].style.opacity = 0;
      dest[2].style.transition = "opacity 1s";
      rocket.ax = -dy / d; // perpendicular
      rocket.ay = dx / d;
    } else {
      rocket.ax = dx / d;
      rocket.ay = dy / d;
    }
  } else { // default is to original position
    var dx = init_x - rocket.x;
    var dy = init_y - rocket.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d > 5) {
      rocket.ax = dx / d;
      rocket.ay = dy / d;
    } else {
      rocket.ax = 0;
      rocket.ay = 0;
    }
  }
  setTimeout(updateAcceleration, 10);
}


var updateRocket = function() {
  rocket.vx += rocket.ax - 0.04 * rocket.vx * rocket.vx * sign(rocket.vx);
  rocket.vy += rocket.ay - 0.04 * rocket.vy * rocket.vy * sign(rocket.vy);
  rocket.vx = clamp(rocket.vx, -10, 10);
  rocket.vy = clamp(rocket.vy, -10, 10);
  rocket.vx = collapse(rocket.vx, -0.1, 0, 0.1);
  rocket.vy = collapse(rocket.vy, -0.1, 0, 0.1);
  rocket.x += rocket.vx;
  rocket.y += rocket.vy;
  rocket.x = collapse(rocket.x, init_x - 2, init_x, init_x + 2);
  rocket.y = collapse(rocket.y, init_y - 2, init_y, init_y + 2);
  rocket.theta = Math.atan2(rocket.vy, rocket.vx) + Math.PI / 4;

  var docked = rocket.x == init_x && rocket.y == init_y;
  if (docked) {
    rocket.theta = 0;
  }
  rocket_el.style.right = (init_x - rocket.x) + "px";
  rocket_el.style.bottom = (init_y - rocket.y) + "px";
  rocket_el.style.transform = "rotate(" + rocket.theta + "rad)";
  rocket_el.style.transition = "transform 0.3s";
  setTimeout(updateRocket, 10);
}

var moon_el = document.createElement("div");
document.body.appendChild(moon_el);
moon_el.innerHTML = "🌕";
moon_el.style.position = "absolute";
moon_el.style.opacity = 0;
moon_el.style.display = "none";


var mouseclick = function(e) {
  var scroll_x = window.scrollX;
  var scroll_y = window.scrollY;
  var new_el = moon_el.cloneNode(true);
  new_el.style.left = (scroll_x + e.clientX) + "px";
  new_el.style.top = (scroll_y + e.clientY) + "px";
  new_el.style.opacity = 1;
  new_el.style.display = "block";
  document.body.appendChild(new_el);
  destination.push([scroll_x + e.clientX, scroll_y + e.clientY, new_el]);
}

updateAcceleration();
updateRocket();

document.addEventListener("click", mouseclick);
