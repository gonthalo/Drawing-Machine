
var lienzo = document.getElementById("canvas");
var pluma = lienzo.getContext("2d");
var tiempo = 0;
var dt = 0.2;
var pausa = false;
var screen_width = lienzo.width;
var screen_height = lienzo.height;
var lineas = true;

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
	var kkk = 1/Math.sqrt(vec[0]*vec[0] + vec[1]*vec[1]);
	return prod(kkk, vec);
}

var p_P = [-300, 200];
var p_Q = [200, 0];
var d = 100;
var r = 30;
var n = 30;
var m = 39;
var punto_w = mover();

function mover(){
	var alfa = 2*Math.PI*(tiempo/n - parseInt(tiempo/n));
	var p_A = sum(p_Q, prod(r, girar([1, 0], alfa)));
	var v_AP = normal(res(p_P, p_A));
	var p_L = sum(p_A, prod(d, v_AP));
	var beta = 2*Math.PI*(tiempo/m - parseInt(tiempo/m));
	console.log(p_L);
	return girar(p_L, -beta);
}

function magia(){
	if (pausa){
		return
	}
	tiempo = tiempo + dt;
	var punto = mover();
	pluma.fillStyle = "black";
	if (lineas){
		pluma.moveTo(screen_width/2 + punto_w[0], screen_height/2 - punto_w[1]);
		pluma.lineTo(screen_width/2 + punto[0], screen_height/2 - punto[1]);
		pluma.stroke();
	} else {
		pluma.beginPath();
		//pluma.arc(500 + parseInt(punto[0]), 300 - parseInt(punto[1]), 2, 0, 2*Math.PI);
		pluma.arc(500 + parseInt(punto[0]), 300 - parseInt(punto[1]), 1, 0, 2*Math.PI);
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

window.setInterval(magia, 20)
