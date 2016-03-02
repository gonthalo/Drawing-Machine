
var lienzo = document.getElementById("canvas");
var pluma = lienzo.getContext("2d");
var tiempo = 0;
var dt = 0.2;
var pausa = false;
var screen_width = lienzo.width;
var screen_height = lienzo.height;
var lineas = true;
var record = false;

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

//Definicion del mecanismo

var p_P = [-100, 200];
var p_Q = [200, 100];
var d1 = 160;
var r1 = 120;
var r2 = 50;
var n1 = 11;
var n2 = 23;
var m = 55;
var engranajes = [];
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
