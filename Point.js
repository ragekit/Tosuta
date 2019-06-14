class point {
 
    constructor(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
  
    Add(value) {
      this.x += value;
      this.y += value;
      this.z += value;
    }
  
    DivideBy(value) {
      this.x /= value;
      this.y /= value;
      this.z /= value;
    }
  
    Floor() {
      this.x = Math.floor(this.x);
      this.y = Math.floor(this.y);
      this.z = Math.floor(this.z);
    }
  
    Normalize() {
      var norm = Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  
      this.x /= norm;
      this.y /= norm;
      this.z /= norm;
    }
  
    ReducePrecision(precision) {
      this.x = Math.floor(this.x*precision)/precision;
      this.y = Math.floor(this.y*precision)/precision;
      this.z = Math.floor(this.z*precision)/precision;
    }
  
    Cross(other) {
      return new point(
        this.y*other.z - this.z*other.y,
        this.z*other.x - this.x*other.z,
        this.x*other.y - this.y*other.x
  
      )
  
    }
  
    Dot(other) {
      return this.x*other.x+this.y*other.y+this.z*other.z;
    }
  
    GetSub(other) {
      return new point(this.x - other.x,
        this.y - other.y,
        this.z - other.z)
    }

    GetMatrix() {
      return [[this.x], [this.y], [this.z], [1]];
    }
  
  
  }

  export default point;