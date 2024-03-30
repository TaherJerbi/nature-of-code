import P5 from "p5";

class Mover {
  private p5: P5;
  position: P5.Vector;
  velocity: P5.Vector;
  acceleration: P5.Vector;
  mass: number;

  constructor(
    p5: P5,
    position?: P5.Vector,
    velocity?: P5.Vector,
    acceleration?: P5.Vector,
    mass?: number,
  ) {
    this.p5 = p5;
    this.position = position || p5.createVector(0, 0);
    this.velocity = velocity || p5.createVector(0, 0);
    this.acceleration = acceleration || p5.createVector(0, 0);
    this.mass = mass || 1;
  }

  applyForce(force: P5.Vector) {
    const f = force.copy();
    f.div(this.mass);
    this.acceleration.add;
    this.acceleration.add(f);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
  }

  show() {
    this.p5.stroke(0);
    this.p5.strokeWeight(2);
    this.p5.fill(255, 127);
    this.p5.circle(this.position.x, this.position.y, this.mass * 16);
  }

  checkEdges() {
    if (this.position.y > this.p5.height) {
      this.velocity.y *= -1;
      this.position.y = this.p5.height;
    }
    if (this.position.x > this.p5.width) {
      this.velocity.x *= -1;
      this.position.x = this.p5.width;
    }
    if (this.position.x < 0) {
      this.velocity.x *= -1;
      this.position.x = 0;
    }
    if (this.position.y < 0) {
      this.velocity.y *= -1;
      this.position.y = 0;
    }
  }
}

const sketch = (p5: P5) => {
  let mover: Mover;
  let offset = 0;
  p5.setup = () => {
    p5.createCanvas(800, 800);
    mover = new Mover(p5, p5.createVector(400, 400));
  };

  p5.draw = () => {
    p5.background(225);

    const gravity = p5.createVector(0, 0.1);
    const wind = p5.createVector(
      p5.map(p5.noise(offset), 0, 1, -0.1, 0.1),
      p5.map(p5.noise(offset + 1000), 0, 1, -0.1, 0.1),
    );
    offset += 0.001;
    mover.applyForce(gravity);
    mover.applyForce(wind);
    mover.update();
    mover.checkEdges();
    mover.show();

    // Line to show wind
    p5.translate(p5.height / 2, p5.width / 2);
    p5.strokeWeight(5);
    p5.stroke(150);
    p5.line(0, 0, wind.x * 1000, wind.y * 1000);
  };
};

export default sketch;
