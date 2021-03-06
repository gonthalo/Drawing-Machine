
var lienzo = document.getElementById("canvas");
var pluma = lienzo.getContext("2d");
pluma.font = "16px Verdana";
var carta = document.getElementById("messages");
var tiempo = 0;
var dt = 0.2;
var pausa = false;
var screen_width = lienzo.width;
var screen_height = lienzo.height;
var lineas = true;
var record = false;
var engranajes = [];
var square_size = 24;
var diagrams = true;
var master_radius = 120;
var dcha_x = screen_width - 3*square_size/2;
var tooth_size = 12;

function signo(x){
	if (x<0){
		return -1;
	}
	return 1;
}

//Funciones auxilares de geometría

function segm(p1, p2){
	return Math.sqrt((p1[0] - p2[0])*(p1[0] - p2[0]) + (p1[1] - p2[1])*(p1[1] - p2[1]));
}

function prod(k, vec){
	var vec2 = [];
	for(var ii=0; ii<vec.length; ii++){
		vec2[ii] = k*vec[ii];
	}
	return vec2;
}

function sum(vec1, vec2){
	var vec3 = [];
	for(var ii=0; ii<vec1.length; ii++){
		vec3[ii] = vec1[ii] + vec2[ii];
	}
	return vec3;
}

function res(vec1, vec2){
	return sum(vec1, prod(-1, vec2));
}

function girar(vec, phi){
	var ccc = Math.cos(phi);
	var sss = Math.sin(phi);
	return [ccc*vec[0] - sss*vec[1], sss*vec[0] + ccc*vec[1]];
}

function normal(vec){
	var kkk = Math.sqrt(vec[0]*vec[0] + vec[1]*vec[1]);
	if (kkk == 0){
		return vec;
	}
	return prod(1/kkk, vec);
}

//Clases de los mecanismos

function Eje(x_, y_, ancla_, d_) {
	this.x = y_;
	this.y = x_;
	this.ancla = ancla_;
	this.d = d_;
	this.tipo = "eje";
}

function Barra(fijo_, movil_, v_) {
	this.fijo = fijo_;
	this.movil = movil_;
	this.p = [engranajes[this.fijo].x, engranajes[this.fijo].y];
	this.v = v_;
	this.tipo = "barra";
}

function Rueda(ancla_, n_, phi_, linked_) {
	this.ancla = ancla_;
	this.n = n_;
	this.phi = phi_;
	this.linked = linked_;
	this.tipo = "rueda";
	if (this.ancla == -1){
		this.p = [0, 0];
	} else {
		this.p = [engranajes[this.ancla].x, engranajes[this.ancla].y];
	}
	this.radio = 0;
}

Eje.prototype.mover = function() {
	if (record){
		pluma.fillStyle = "red";
		pluma.beginPath();
		pluma.arc(screen_width/2 + parseInt(this.y), screen_height/2 - parseInt(this.x), 1, 0, 2*Math.PI);
		pluma.stroke();
	}
	if (this.ancla == -1){
		return;
	}
	ref = engranajes[this.ancla];
	if (ref.tipo == "rueda"){
		vec1 = sum(ref.p, girar([this.d, 0], ref.phi));
		this.x = vec1[0];
		this.y = vec1[1];
	}
	if (ref.tipo == "barra"){
		var vec1 = sum(ref.p, prod(this.d, ref.v));
		this.x = vec1[0];
		this.y = vec1[1];
	}
};

Barra.prototype.mover = function() {
	this.p = [engranajes[this.fijo].x, engranajes[this.fijo].y];
	var p_1 = [engranajes[this.movil].x, engranajes[this.movil].y];
	this.v = normal(res(p_1, this.p));
}

Rueda.prototype.mover = function() {
	this.phi = 2*Math.PI*(tiempo/this.n - parseInt(tiempo/this.n));
	if (this.ancla == -1){
		this.phi *= -1;
		return;
	}
	this.p = [engranajes[this.ancla].x, engranajes[this.ancla].y];
	if (this.linked != -1){
		this.phi = -this.phi*signo(engranajes[this.linked].phi);
	}
}

//funciones de los graficos

function randcol(){
	var lis = [parseInt(Math.random()*3 + 1)*85, parseInt(Math.random()*3 + 1)*85, parseInt(Math.random()*3 + 1)*85];
	if (lis[0] == lis[1] && lis[1] == lis[2] && lis[2] == lis[0]){
		return randcol();
	}
	return lis;
}

function rgbstr(lis){
	return "rgb(" + lis[0] + "," + lis[1] + "," + lis[2] + ")";
}

function make_square(xx, yy){
	pluma.beginPath();
	pluma.moveTo(xx + square_size, yy + square_size - 8);
	pluma.arcTo(xx + square_size, yy + square_size, xx + square_size - 8, yy + square_size, 8);
	pluma.lineTo(xx - square_size + 8, yy + square_size);
	pluma.arcTo(xx - square_size, yy + square_size, xx - square_size, yy + square_size - 8, 8);
	pluma.lineTo(xx - square_size, yy - square_size + 8);
	pluma.arcTo(xx - square_size, yy - square_size, xx - square_size + 8, yy - square_size, 8);
	pluma.lineTo(xx + square_size - 8, yy - square_size);
	pluma.arcTo(xx + square_size, yy - square_size, xx + square_size, yy - square_size + 8, 8);
	pluma.lineTo(xx + square_size, yy + square_size - 8);
	pluma.fill();
}

function gear(n){
	if (n>9){
		return 1;
	}
	return 0;
}

function spike(n){
	if (n>9){
		return 2 - n/10.0;
	}
	return n/10.0;
}

function radial_f(x0, y0, r, n, k, r0, phi0){
	pluma.moveTo(x0 + (r0 + k*r(0))*Math.cos(phi0), y0 + (r0 + k*r(0))*Math.sin(phi0));
	for (var ii = 1; ii<=20*n; ii++){
		pluma.lineTo(x0 + (k*r(ii%20) + r0)*Math.cos(ii*Math.PI/10/n + phi0), y0 + (k*r(ii%20) + r0)*Math.sin(ii*Math.PI/10/n + phi0));
	}
	pluma.stroke();
}

function eje_sym(xx, yy, text){
	pluma.beginPath();
	pluma.arc(xx - square_size/3.5, yy, square_size/4, 0, 2*Math.PI);
	pluma.stroke();
	pluma.beginPath();
	pluma.arc(xx - square_size/3.5, yy, square_size/8, 0, 2*Math.PI);
	pluma.fill();
	pluma.moveTo(xx - square_size/3.5, yy + square_size/2);
	pluma.lineTo(xx - square_size/3.5, yy - square_size/2);
	pluma.stroke();
	pluma.fillText(text, xx - 5 + square_size/3, yy + 5);
}

function barra_sym(xx, yy, text){
	var ra = square_size/4;
	var cx = xx - square_size/3;
	var cy = yy + square_size/2;
	pluma.beginPath();
	pluma.moveTo(cx - ra, yy - 2*square_size/3);
	pluma.lineTo(cx - ra, cy);
	pluma.arcTo(cx - ra, cy + ra, cx, cy + ra, ra);
	pluma.arcTo(cx + ra, cy + ra, cx + ra, cy, ra);
	pluma.lineTo(cx + ra, yy - 2*square_size/3);
	pluma.stroke();
	pluma.beginPath();
	pluma.arc(cx, cy, ra/2, 0, 2*Math.PI);
	pluma.fill();
	pluma.beginPath();
	pluma.arc(cx, yy - square_size/3, ra/2, 0, 2*Math.PI);
	pluma.fill();
	pluma.fillText(text, xx - 5 + square_size/3, yy + 5);
}

function show_sym(name, colorin, index){
	var stack = parseInt(screen_height/square_size/3);
	var yy = index%stack + 0.5;
	var xx = parseInt(index/stack) + 0.5;
	xx = xx*3*square_size;
	yy = yy*3*square_size;
	pluma.fillStyle = colorin;//"rgb(5, 200, 100)";
	make_square(xx, yy);
	pluma.fillStyle = "black";
	if (name=="rueda"){
		radial_f(xx, yy, gear, 7, square_size/5, square_size/1.8, 0);
		if (index < 10){
			pluma.fillText(index, xx - 5, yy + 5);
		} else {
			pluma.fillText(index, xx - 10, yy + 5);
		}
	}
	if (name=="eje"){
		pluma.stroke();
		if (index < 10){
			eje_sym(xx, yy, index);
		} else {
			eje_sym(xx - 5, yy, index);
		}
	}
	if (name=="barra"){
		pluma.stroke();
		barra_sym(xx, yy, index);
	}
}

Eje.prototype.diagrama = function() {
	pluma.beginPath();
	pluma.arc(screen_width/2 + this.x, screen_height/2 + this.y, 20/4, 0, 2*Math.PI);
	pluma.stroke();
	pluma.beginPath();
	pluma.arc(screen_width/2 + this.x, screen_height/2 + this.y, 20/8, 0, 2*Math.PI);
	pluma.fill();
	pluma.moveTo(screen_width/2 + this.x, screen_height/2 + this.y + 20/2);
	pluma.lineTo(screen_width/2 + this.x, screen_height/2 + this.y - 20/2);
	pluma.stroke();
};

Barra.prototype.diagrama = function() {
	alfa = this.v[0];
	beta = this.v[1];
	pluma.beginPath();
	pluma.moveTo(screen_width/2 + this.p[0] + screen_height*alfa - 10*beta, screen_height/2 + this.p[1] + screen_height*beta + 10*alfa);
	pluma.lineTo(screen_width/2 + this.p[0] - 10*beta, screen_height/2 + this.p[1] + 10*alfa);
	pluma.arcTo(screen_width/2 + this.p[0] - 10*alfa - 10*beta, screen_height/2 + this.p[1] + 10*alfa - 10*beta, screen_width/2 + this.p[0] - 10*alfa, screen_height/2 + this.p[1] - 10*beta, 10);
	pluma.arcTo(screen_width/2 + this.p[0] + 10*beta - 10*alfa, screen_height/2 + this.p[1] - 10*alfa - 10*beta, screen_width/2 + this.p[0] + 10*beta, screen_height/2 + this.p[1] - 10*alfa, 10);
	pluma.lineTo(screen_width/2 + this.p[0] + 10*beta + screen_height*alfa, screen_height/2 + this.p[1] - 10*alfa + screen_height*beta);
	pluma.stroke();
};

Rueda.prototype.diagrama = function() {
	if (this.linked == -1){
		this.radio = -segm(this.p, [0, 0]) + tooth_size + master_radius;
	} else {
		this.radio = segm(this.p, engranajes[this.linked].p) - Math.abs(engranajes[this.linked].radio);
		this.radio += -signo(this.radio)*tooth_size;
	}
	radial_f(screen_width/2 + this.p[0], screen_height/2 + this.p[1], spike, this.n, tooth_size, this.radio, this.phi);
};

//Input y construccion del mecanismo

function get_id(xx, yy){
	return parseInt(yy/square_size/3) + parseInt(screen_height/square_size/3)*parseInt(xx/square_size/3);
}

function quitar(acting){
	console.log(acting);
	delete engranajes[acting];
	for (var ii=acting + 1; ii<engranajes.length; ii++){
		var recycle = (engranajes[ii].movil == acting || engranajes[ii].fijo == acting || engranajes[ii].linked == acting || engranajes[ii].ancla == acting)
		console.log([ii, recycle]);
		if (!recycle){
			if (engranajes[ii].tipo == "rueda"){
				if (engranajes[ii].ancla > acting){
					engranajes[ii].ancla -= 1;
				}
				if (engranajes[ii].linked > acting){
					engranajes[ii].linked -= 1;
				}
			}
			if (engranajes[ii].tipo == "eje"){
				if (engranajes[ii].ancla > acting){
					engranajes[ii].ancla -= 1;
				}
			}
			if (engranajes[ii].tipo == "barra"){
				if (engranajes[ii].fijo > acting){
					engranajes[ii].fijo -= 1;
				}
				if (engranajes[ii].movil > acting){
					engranajes[ii].movil -= 1;
				}
			}
		} else {
			quitar(ii);
		}
	}
	engranajes.splice(acting, 1);
}

function cambiar(acting){
	var color_random = engranajes[acting].color;
	if (engranajes[acting].tipo=="rueda"){
		var id_eje = parseInt(window.prompt("Eje de giro:", engranajes[acting].ancla));
		if (id_eje == -1 || id_eje>=engranajes.length){
			return;
		}
		var id_linked = parseInt(window.prompt("Rueda ligada:", engranajes[acting].linked));
		var n_dientes = parseInt(window.prompt("Nº de dientes:", engranajes[acting].n));
		if (n_dientes == -1){
			var p = [engranajes[id_eje].x, engranajes[id_eje].y];
			if (id_linked == -1){
				n_dientes = parseInt(m/master_radius*(segm(p, [0, 0]) - master_radius - tooth_size));
			} else {
				n_dientes = parseInt(m/engranajes[id_linked].radio*(Math.abs(engranajes[id_linked].radio) - segm(p, engranajes[id_linked].p) - tooth_size));
			}
		}
		engranajes[acting] = new Rueda(id_eje, n_dientes, 0, id_linked);
	}
	if (engranajes[acting].tipo=="eje"){
		var predet = engranajes[acting].ancla;
		if (predet == -1){
			predet = "ninguno";
		}
		var ref = window.prompt("Objeto anclado:", predet);
		if (ref<0 || ref>=engranajes.length){
			return;
		}
		var xx = 0;
		var yy = 0;
		var ancla = -1;
		var dist = 0;
		if (ref == "ninguno"){
			yy = parseInt(window.prompt("Coordenada X:", engranajes[acting].x));
			xx = parseInt(window.prompt("Coordenada Y:", engranajes[acting].y));
		} else {
			ref = parseInt(ref);
			ancla = ref;
			dist = parseInt(window.prompt("Distancia o Radio:", engranajes[acting].d));
			xx = engranajes[ref].p[0] + dist;
			yy = engranajes[ref].p[1];
		}
		engranajes[acting] = new Eje(xx, yy, ancla, dist);
	}
	if (engranajes[acting].tipo == "barra"){
		var e_fijo = parseInt(window.prompt("Eje fijo:", engranajes[acting].fijo));
		var e_libre = parseInt(window.prompt("Eje libre:", engranajes[acting].movil));
		engranajes[acting] = new Barra(e_fijo, e_libre, [0, 0]);
	}
	engranajes[acting].color = color_random;
}

function boton(texto, funcion){
	return '<input type="button" onclick="' + funcion + '" value="' + texto + '">';
}

function act(index){
	messages.innerHTML = boton("Quitar el objeto " + index, "quitar(" + index + ")");
	messages.innerHTML += boton("Cambiar el objeto " + index, "cambiar(" + index + ")");
}

function get_click (e){
	var x;
	var y;
	if (e.pageX || e.pageY) {
		x = e.pageX;
		y = e.pageY;
	} else {
		x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
		y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	}
	x -= lienzo.offsetLeft;
	y -= lienzo.offsetTop;
	console.log(x, y);
	yyy = parseInt(y/square_size - 0.5);
	xxx = parseInt(x/square_size - 0.5);
	if (yyy%3 != 2){
		if (Math.abs(x - dcha_x) < square_size){
			if (parseInt(yyy/3) == 0){
				crear("eje");
			}
			if (parseInt(yyy/3) == 1){
				crear("barra");
			}
			if (parseInt(yyy/3) == 2){
				crear("rueda");
			}
			return;
		}
		if (parseInt(screen_height/square_size/3)*parseInt(xxx/3) + parseInt(yyy/3) < engranajes.length && xxx%3 != 2){
			act(get_id(x, y));
			return;
		}
	}
	engranajes[engranajes.length] = new Eje(y - screen_height/2, x - screen_width/2, -1, 0);
	engranajes[engranajes.length - 1].color = rgbstr(randcol());
}

function crear(nombre){
	var color_random = rgbstr(randcol());
	//show_sym(nombre, color_random, engranajes.length);
	if (nombre=="rueda"){
		var id_eje = parseInt(window.prompt("Eje de giro:"));
		if (id_eje == -1 || id_eje>=engranajes.length){
			return;
		}
		var id_linked = parseInt(window.prompt("Rueda ligada:"));
		var n_dientes = parseInt(window.prompt("Nº de dientes:"));
		if (n_dientes == -1){
			var p = [engranajes[id_eje].x, engranajes[id_eje].y];
			if (id_linked == -1){
				n_dientes = parseInt(m/master_radius*(segm(p, [0, 0]) - master_radius - tooth_size));
			} else {
				n_dientes = parseInt(m/engranajes[id_linked].radio*(Math.abs(engranajes[id_linked].radio) - segm(p, engranajes[id_linked].p) - tooth_size));
			}
		}
		engranajes[engranajes.length] = new Rueda(id_eje, n_dientes, 0, id_linked);
	}
	if (nombre=="eje"){
		var ref = window.prompt("Objeto anclado:");
		if (ref<0 || ref>=engranajes.length){
			return;
		}
		var xx = 0;
		var yy = 0;
		var ancla = -1;
		var dist = 0;
		if (ref == "ninguno"){
			yy = parseInt(window.prompt("Coordenada X:"));
			xx = parseInt(window.prompt("Coordenada Y:"));
		} else {
			ref = parseInt(ref);
			ancla = ref;
			dist = parseInt(window.prompt("Distancia o Radio:"));
			xx = engranajes[ref].p[0] + dist;
			yy = engranajes[ref].p[1];
		}
		engranajes[engranajes.length] = new Eje(xx, yy, ancla, dist);
	}
	if (nombre == "barra"){
		var e_fijo = parseInt(window.prompt("Eje fijo:"));
		var e_libre = parseInt(window.prompt("Eje libre:"));
		engranajes[engranajes.length] = new Barra(e_fijo, e_libre, [0, 0]);
	}
	engranajes[engranajes.length - 1].color = color_random;
	engranajes[engranajes.length - 1].diagrama();
}

function creacion(){
	nombre = window.prompt("Tipo de pieza:");
	crear(nombre);
}

var p_P = [-100, 200];
var p_Q = [200, 100];
var d1 = 160;
var r1 = 120;
var r2 = 50;
var n1 = 16;
var n2 = 23;
var m = 56;
var id_pluma = 7;
var origin = new Eje(0, 0, -1, 0);
var master_wheel = new Rueda(-1, m, 0, -1);

/*
engranajes[0] = new Eje(p_P[0], p_P[1], -1, 0);
engranajes[1] = new Eje(p_Q[0], p_Q[1], -1, 0);
engranajes[2] = new Rueda(1, n1, 0, -1);
engranajes[3] = new Eje(0, 0, 2, r1);
engranajes[4] = new Barra(3, 0, [0, 0]);
engranajes[5] = new Eje(0, 0, 4, d1);
*/

engranajes[0] = new Eje(p_P[0], p_P[1], -1, 0);
engranajes[1] = new Rueda(0, n2, 0, -1);
engranajes[2] = new Eje(0, 0, 1, r2);
engranajes[3] = new Eje(p_Q[0], p_Q[1], -1, 0);
engranajes[4] = new Rueda(3, n1, 0, -1);
engranajes[5] = new Eje(0, 0, 4, r1);
engranajes[6] = new Barra(5, 2, [0, 0]);
engranajes[7] = new Eje(0, 0, 6, d1);

for (var ii = 0; ii<8; ii++){
	engranajes[ii].color = rgbstr(randcol());
}

var punto_w = mover();

function mover(){
	for (var ii=0; ii<engranajes.length; ii++){
		engranajes[ii].mover();
	}
	var p_L = [engranajes[id_pluma].x, engranajes[id_pluma].y];
	var beta = 2*Math.PI*(tiempo/m - parseInt(tiempo/m));
	//console.log(p_L);
	return girar(p_L, -beta);
}

function magia(){
	if (pausa){
		return;
	}
	tiempo = tiempo + dt;
	if (diagrams){
		borrar();
		mover();
		pluma.fillStyle = "black";
		for (var ii=0; ii<engranajes.length; ii++){
			show_sym(engranajes[ii].tipo, engranajes[ii].color, ii);
			engranajes[ii].diagrama();
		}
		master_wheel.mover();
		master_wheel.diagrama();
		origin.diagrama();
		pluma.fillStyle = "white";
		for (var ii=0; ii<3; ii++){
			make_square(dcha_x, 3*square_size*(ii + 0.5));
			pluma.stroke();
		}
		pluma.fillStyle = "black";
		eje_sym(dcha_x, 1.5*square_size, "+");
		barra_sym(dcha_x, 4.5*square_size, "+");
		radial_f(dcha_x, 7.5*square_size, gear, 7, square_size/5, square_size/1.8, 0);
		pluma.fillText("+", dcha_x - 6, 7.5*square_size + 5);
		return;
	}
	var punto = mover();
	pluma.fillStyle = "black";
	pluma.beginPath();
	pluma.stroke();
	if (lineas){
		pluma.moveTo(screen_width/2 + punto_w[1], screen_height/2 - punto_w[0]);
		pluma.lineTo(screen_width/2 + punto[1], screen_height/2 - punto[0]);
		pluma.stroke();
	} else {
		pluma.beginPath();
		pluma.arc(screen_width/2 + parseInt(punto[1]), screen_height/2 - parseInt(punto[0]), 1, 0, 2*Math.PI);
		pluma.stroke();
	}
	punto_w = punto;
}

function borrar(){
	pluma.fillStyle = "white";
	pluma.fillRect(0, 0, screen_width, screen_height);
}

function reset(){
	pluma.beginPath();
	pluma.stroke();
	tiempo = 0;
	punto_w = mover();
	borrar();
}

function mecanismo(){
	if (diagrams){
		document.getElementById("boton").value = "Ver mecanismo";
	} else {
		document.getElementById("boton").value = "Ver dibujo";
	}
	diagrams = !diagrams;
	pluma.beginPath();
	pluma.stroke();
	punto_w = mover();
	borrar();
}

borrar();

window.setInterval(magia, 5)
