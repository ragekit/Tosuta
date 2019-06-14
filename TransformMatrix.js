import point from "./Point.js"

class TransformMatrix {

  constructor(a) {
    this.value = a;
  }

  RotateAroundY(value) {
    this.value[0][0] = Math.cos(value);
    this.value[0][2] = Math.sin(value);
    this.value[2][0] = -Math.sin(value);
    this.value[2][2] = Math.cos(value);
  }
 
  multRowIndexWith(index, collumn) {

    return this.value[index][0] * collumn[0][0] +
    this.value[index][1] * collumn[1][0] +
    this.value[index][2] * collumn[2][0] +
    this.value[index][3] * collumn[3][0]
  }

}

TransformMatrix.mult = function(matrix, p) {
  var pointMatrix = p.GetMatrix();
  return new point(
    matrix.multRowIndexWith(0, pointMatrix),
    matrix.multRowIndexWith(1, pointMatrix),
    matrix.multRowIndexWith(2, pointMatrix)
 //   matrix.multRowIndexWith(3, pointMatrix)
  );
}

export default TransformMatrix;