import point from "./Point.js"
import TransformMatrix from "./TransformMatrix.js"

let screen = document.getElementsByTagName("canvas")[0];
const WIDTH = 640;
const HEIGHT = 480;
screen.width = WIDTH;
screen.height = HEIGHT;
let ctx = screen.getContext("2d");
ctx.imageSmoothingEnabled = false;
document.body.style.overflow = 'hidden';
screen.style.width = 100 + "%";
screen.style.height = 100 + "%";
screen.style.imageRendering = "pixelated";
let frameBuffer = ctx.createImageData(WIDTH, HEIGHT);

let data = frameBuffer.data;

// let image = document.getElementsByTagName('img')[0];
// var textureCanvas = document.createElement('canvas');
// textureCanvas.width = 256;
// textureCanvas.height = 256
// // Get the drawing context
// var textureContext = textureCanvas.getContext('2d');
// textureContext.drawImage(image, 0, 0);
// var texture = textureContext.getImageData(0, 0, 256, 256);


function SetPixel(index, r, g, b, a) {
  data[index*4] = r;
  data[index*4+1] = g;
  data[index*4+2] = b;
  data[index*4+3] = a;
}

function GetDataXY(texture, x, y) {

  //console.log(Math.floor(y*texture.width+x));
  return GetData(texture, Math.floor(y)*texture.width+Math.floor(x));
}

function GetData(texture, index) {
  var color = {
    r: texture.data[index*4],
    g: texture.data[index*4+1],
    b: texture.data[index*4+2]

  }
  return color;
}

function SetPixelXY(x, y, r, g, b, a) {
  SetPixel(y*screen.width+x, r, g, b, a);
}

let frame = 0;


let cameraMatrix = new TransformMatrix(
  [[1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]]);

//roughly fov
const scaleratio = 1;

let ObjectMatrix = new TransformMatrix(
  [[1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0,1, -10/scaleratio],
    [0, 0, 0, 1]]);




const cwidth = scaleratio*WIDTH/HEIGHT;
const cheight = scaleratio;

function pointToScreen(p) {

  var projectedPoint = TransformMatrix.mult(cameraMatrix, p);
  var savedz = projectedPoint.z;
  projectedPoint.DivideBy(-projectedPoint.z);
  projectedPoint.z = savedz;

  //NDC
  projectedPoint.x = (projectedPoint.x+(cwidth/2))/cwidth;
  projectedPoint.y = (projectedPoint.y+(cheight/2))/cheight;
  //Screen

  projectedPoint.x *= WIDTH;
  projectedPoint.y = (1-projectedPoint.y)*HEIGHT;

  return projectedPoint;
}

function lineBetween(p, pp) {
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(pp.x, pp.y);
}

var lightDirection = new point(0, -1, 1);
lightDirection.Normalize();

var rotationY = 0;


document.addEventListener('mousemove', (e) => {

  rotationY = e.clientX;

})

var zbuffer = [];

function update(t) {

  //vertex shader ish;
  ObjectMatrix.RotateAroundY(t/100);
  zbuffer.fill(300);
  
  for (var x = 0; x < WIDTH; x++) {
    for (var y = 0; y < HEIGHT; y++) {
      if((t+y)%2)
      SetPixelXY(x,y,0,0,0,255);
    }
  }


  for (var j = 0; j < objectTriangles.length; j++) {

    var t1 = objectVertex[objectTriangles[j][0]];
    var t2 = objectVertex[objectTriangles[j][1]];
    var t3 = objectVertex[objectTriangles[j][2]];


    var worldPointA = TransformMatrix.mult(ObjectMatrix, t1);
    var worldPointB = TransformMatrix.mult(ObjectMatrix, t2);
    var worldPointC = TransformMatrix.mult(ObjectMatrix, t3);

    var precision = 30;
    worldPointA.ReducePrecision(precision);
    worldPointB.ReducePrecision(precision);
    worldPointC.ReducePrecision(precision);

    var ab = worldPointB.GetSub(worldPointA);
    var ac = worldPointC.GetSub(worldPointA);
    var normal = ab.Cross(ac);
    normal.Normalize();
    var cameraForward = new point(0, 0, -1);
    if (cameraForward.Dot(normal) >= 0) continue;

    if (worldPointA.z >= -1 && worldPointB.z >= -1 && worldPointC.z >= -1) continue
    if (worldPointA.z >= -1) worldPointA.z = -1.0001;
    if (worldPointB.z >= -1) worldPointB.z = -1.0001;
    if (worldPointC.z >= -1) worldPointC.z = -1.0001;

    var dot = lightDirection.Dot(normal);

    var a = pointToScreen(worldPointA);
    var b = pointToScreen(worldPointB);
    var c = pointToScreen(worldPointC);


    var auv = UVs[textureUVSIndices[j][0]];
    var buv = UVs[textureUVSIndices[j][1]];
    var cuv = UVs[textureUVSIndices[j][2]];

    var xmin = Math.round(Math.min(Math.min(a.x, b.x), c.x));
    var ymin = Math.round(Math.min(Math.min(a.y, b.y), c.y));
    var xmax = Math.round(Math.max(Math.max(a.x, b.x), c.x));
    var ymax = Math.round(Math.max(Math.max(a.y, b.y), c.y));
    dot = Math.max(0, Math.min(1, dot))*.8;

    var meanz = (a.z + b.z + c.z)/3;
    meanz = -(meanz+1);


    for (var x = xmin; x <= xmax; x++) {
      for (var y = ymin; y <= ymax; y++) {

        if ((t+y)%2 == 0) continue

        var currentfragment = new point(x, y, 0);

        if (PointInTriangle(currentfragment, a, b, c)) {
          if (zbuffer[y*WIDTH + x] != null) {

            if (meanz > zbuffer[y*WIDTH + x]) continue;
          }

          var bar = Barycentric(currentfragment, a, b, c);
          var uv = computeUV(bar, auv, buv, cuv);
       //   var color = GetDataXY(texture, uv[0]*256, (1-uv[1])*256);
          var color = {r:255,g:255,b:255}
          var lightValue = dot +.2;

          zbuffer[y*WIDTH + x] = meanz;
        //SetPixelXY(x,y,zbuffer[y*WIDTH + x]*10,zbuffer[y*WIDTH + x]*10,zbuffer[y*WIDTH + x]*10,255)
        SetPixelXY(x, y, lightValue*color.r, lightValue*color.g, lightValue*color.b, 255)
        }
      }
    }
  }
}

function computeUV(bar, a, b, c) {
  var obj = [
    (bar.u*a[0] + bar.v*b[0] + bar.w*c[0]),
    (bar.u*a[1] + bar.v*b[1] + bar.w*c[1])
  ]
  // console.log(obj)

  return obj
}


function Barycentric(p, a, b, c) {
  var v0 = b.GetSub(a);
  var v1 = c.GetSub(a);
  var v2 = p.GetSub(a);
  var d00 = v0.Dot(v0);
  var d01 = v0.Dot(v1);
  var d11 = v1.Dot(v1);
  var d20 = v2.Dot(v0);
  var d21 = v2.Dot(v1);
  var denom = d00 * d11 - d01 * d01;
  var v = (d11 * d20 - d01 * d21) / denom;
  var w = (d00 * d21 - d01 * d20) / denom;
  var u = 1.0 - v - w;
  return {
    u: u, v: v, w: w
  }
}


function PointInTriangle (pt, v1, v2, v3) {

  function sign (p1, p2, p3) {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  }
  var d1, d2, d3;
  var has_neg, has_pos;

  d1 = sign(pt, v1, v2);
  d2 = sign(pt, v2, v3);
  d3 = sign(pt, v3, v1);

  has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);

  return !(has_neg && has_pos);
}
function cleanArray(arr){
  var i = arr.indexOf("");
  while(i>=0){
    arr.splice(i,1);
    
    i = arr.indexOf("");
  }
  
}



var objectVertex = [new point(0, 0, 0)];
var objectTriangles = [];
var textureUVSIndices = [];
var UVs = [[0, 0]];
function ParseObjString(string) {
  var lines = string.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.startsWith("v")) {
      var values = line.split(" ");
      cleanArray(values);

      var vertex = new point(parseFloat(values[1]), parseFloat(values[2]), parseFloat(values[3]))
      objectVertex.push(vertex);
    }

    if (line.startsWith("vt")) {
      var values = line.split(" ");

      var xy = [parseFloat(values[1]), parseFloat(values[2])];
      UVs.push(xy);

    }

    if (line.startsWith("f")) {
      var values = line.split(" ");

      var tri = [parseFloat(values[1].split("/")[0]),
        parseFloat(values[2].split("/")[0]),
        parseFloat(values[3].split("/")[0])]

      var uvs = [parseFloat(values[1].split("/")[1]),
        parseFloat(values[2].split("/")[1]),
        parseFloat(values[3].split("/")[1])]

      objectTriangles.push(tri);
      textureUVSIndices.push(uvs);
    }
  }
}

fetch("./model.obj").then((response) => response.text()).then((text)=> {ParseObjString(text)});
var previousTime = 0;
var lastFrameTested = 0;
var fps =0;
(function step(time) {
  //screen.width = screen.width;

  
 

  if(frame-lastFrameTested >= 10){
      var deltaTime = time-previousTime;
      previousTime = time;
      fps = Math.floor((1000*10)/deltaTime);
      lastFrameTested = frame;
  }
  update(frame);
  frame += 1;
  
  ctx.font = "20px Arial";
  
      ctx.fillStyle = "red";
  ctx.putImageData(frameBuffer, 0, 0);
  ctx.fillText(fps.toString(), 10, 50);

  requestAnimationFrame(step);
})(0)

//requestAnimationFrame(step);