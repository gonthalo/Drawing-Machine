
var lienzo = document.getElementById("canvas");
var pluma = lienzo.getContext("2d");
var carta = document.getElementById("messages");
var tiempo = 0;
var dt = 0.2;
var pausa = false;
var screen_width = lienzo.width;
var screen_height = lienzo.height;
var lineas = true;
var record = false;
var engranajes = [];
var raton = [-1, -1];
var square_size = 30;

function signo(x){
	if (x<0){
		return -x;
	}
	return x;
}

//Funciones auxilares de geometría

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
	this.p = [engranajes[this.ancla].x, engranajes[this.ancla].y];
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
	this.p = [engranajes[this.ancla].x, engranajes[this.ancla].y];
	this.phi = 2*Math.PI*(tiempo/this.n - parseInt(tiempo/this.n));
	if (this.linked != -1){
		this.phi = -this.phi*signo(engranajes[linked].phi);
	}
}

//funciones de los graficos

function randcol(){
	var lis = [parseInt(Math.random()*3 + 1)*85, parseInt(Math.random()*3 + 1)*85, parseInt(Math.random()*3 + 1)*85];
	if (lis[0] + lis[1] + lis[2]==0){
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

function radial_f(x0, y0, r, n, k, r0){
	pluma.moveTo(x0 + r0 + k*r(0), y0);
	for (var ii = 1; ii<=20*n; ii++){
		pluma.lineTo(x0 + (k*r(ii%20) + r0)*Math.cos(ii*Math.PI/10/n), y0 + (k*r(ii%20) + r0)*Math.sin(ii*Math.PI/10/n));
	}
	pluma.stroke();
}

function show_sym(name){
	var stack = parseInt(screen_height/square_size/3);
	var yy = engranajes.length%stack + 0.5;
	var xx = parseInt(engranajes.length/stack) + 0.5;
	xx = xx*3*square_size;
	yy = yy*3*square_size;
	pluma.fillStyle = rgbstr(randcol());//"rgb(5, 200, 100)";
	make_square(xx, yy);
	if (name=="rueda"){
		radial_f(xx, yy, gear, 7, square_size/5, square_size/1.8);
	}
	if (name=="eje"){
		pluma.beginPath();
		pluma.arc(xx, yy, square_size/4, 0, 2*Math.PI);
		pluma.stroke();
		pluma.beginPath();
		pluma.arc(xx, yy, square_size/8, 0, 2*Math.PI);
		pluma.fill();
		pluma.moveTo(xx + square_size/2, yy);
		pluma.lineTo(xx - square_size/2, yy);
		pluma.stroke();
	}
	if (name=="barra"){}
}

Eje.prototype.diagrama = function() {
	pluma.beginPath();
	pluma.arc(screen_width/2 + this.x, screen_height/2 + this.y, 20/4, 0, 2*Math.PI);
	pluma.stroke();
	pluma.beginPath();
	pluma.arc(screen_width/2 + this.x, screen_height/2 + this.y, 20/8, 0, 2*Math.PI);
	pluma.fill();
	pluma.moveTo(screen_width/2 + this.x + 20/2, screen_height/2 + this.y);
	pluma.lineTo(screen_width/2 + this.x - 20/2, screen_height/2 + this.y);
	pluma.stroke();
};

Barra.prototype.diagrama = function() {
	
};

Rueda.prototype.diagrama = function() {
	radial_f(screen_width/2 + this.p[0], screen_height/2 + this.p[1], gear, this.n, 20, this.n*10/Math.PI);
};

//Input y construccion del mecanismo

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
	raton = [x, y];
}

function get_id(xx, yy){
	/*raton = [-1, -1];
	while (raton[0] == -1){
		setTimeout(function(){
    	}, 200);
	}*/
	return parseInt(yy/square_size/3) + parseInt(screen_height/square_size/3)*parseInt(xx/square_size/3);
}

function crear(nombre){
	show_sym(nombre);
	if (nombre=="rueda"){
		var n_dientes = parseInt(window.prompt("Nº de dientes:"));
		var id_eje = parseInt(window.prompt("Eje de giro:"));
		if (id_eje == -1 || id_eje>=engranajes.length){
			return;
		}
		var id_linked = parseInt(window.prompt("Rueda ligada:"));
		if (id_linked == -1){};
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
			xx = parseInt(window.prompt("Coordenada X:"));
			yy = parseInt(window.prompt("Coordenada Y:"));
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
	engranajes[engranajes.length - 1].diagrama();
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


var punto_w = mover();

function mover(){
	for (var ii=0; ii<engranajes.length; ii++){
		engranajes[ii].mover();
	}
	var p_L = [engranajes[id_pluma].x, engranajes[id_pluma].y];
	var beta = 2*Math.PI*(tiempo/m - parseInt(tiempo/m));
	console.log(p_L);
	return girar(p_L, -beta);
}

function magia(){
	if (pausa){
		return
	}
	tiempo = tiempo + dt;
	if (record){
		//borrar();
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
	tiempo = 0;
}

window.setInterval(magia, 5)
