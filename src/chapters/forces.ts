import P5 from "p5";

class Mover {
  private p5: P5;
  position: P5.Vector;
  velocity: P5.Vector;
  acceleration: P5.Vector;
  mass: number;
  diameter: number;

  dragging: boolean;
  dragStart: P5.Vector | undefined;
  dragEnd: P5.Vector | undefined;
  dragAverageVelocity: P5.Vector | undefined;
  dragOffset: P5.Vector | undefined;

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
    this.diameter = 48;
    this.dragging = false;
  }

  applyForce(force: P5.Vector) {
    const f = force.copy();
    f.div(this.mass);
    this.acceleration.add(f);
    this.acceleration.limit(10);
  }

  update() {
    if (this.dragging) return;
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
  }

  show() {
    this.p5.stroke(0);
    this.p5.strokeWeight(this.dragging ? 4 : 1);
    const color: P5.Color = this.p5.color(
      255 - this.mass * 16 + (this.dragging ? 100 : 0),
    );
    this.p5.fill(color);
    this.p5.circle(this.position.x, this.position.y, this.diameter);
  }

  contactEdges() {
    return this.position.y > this.p5.height - this.diameter / 2 - 1;
  }

  checkEdges() {
    this._wallBounce();
  }

  checkMouse() {
    if (this.p5.mouseIsPressed) {
      const mouse = this.p5.createVector(this.p5.mouseX, this.p5.mouseY);
      const offset = mouse.copy().sub(this.position);
      if (offset.mag() < this.diameter / 2) {
        if (!this.dragging) {
          this.dragStart = this.position.copy();
          this.dragOffset = offset;
        }
        this.dragging = true;
        this.velocity.mult(0);
        this.acceleration.mult(0);
      }

      if (this.dragging) {
        const newPosition = mouse.copy().sub(this.dragOffset ?? this.position);
        this.dragAverageVelocity = newPosition
          .copy()
          .sub(this.position.copy())
          .add(this.dragAverageVelocity ?? this.p5.createVector(0, 0))
          .div(2);
        this.position = newPosition;
      }
    } else {
      if (this.dragging && this.dragStart) {
        this.dragEnd = this.position.copy();
        this.applyForce(
          this.dragAverageVelocity?.normalize()?.mult(10 * this.mass) ??
            this.p5.createVector(0, 0),
        );
        this.dragStart = undefined;
        this.dragEnd = undefined;
      }
      this.dragging = false;
    }
  }

  _wallBounce() {
    const bounce = -0.9;
    if (this.position.y > this.p5.height - this.diameter / 2) {
      this.velocity.y *= bounce;
      this.position.y = this.p5.height - this.diameter / 2;
    }
    if (this.position.x > this.p5.width - this.diameter / 2) {
      this.velocity.x *= bounce;
      this.position.x = this.p5.width - this.diameter / 2;
    }
    if (this.position.x < this.diameter / 2) {
      this.velocity.x *= bounce;
      this.position.x = this.diameter / 2;
    }
    if (this.position.y < this.diameter / 2) {
      this.velocity.y *= bounce;
      this.position.y = this.diameter / 2;
    }
  }

  _wallForce() {
    const force = 40;
    const y = this.position.y;
    const x = this.position.x;
    const force_top = this.p5.createVector(0, force / Math.abs(y));
    const force_bottom = this.p5.createVector(
      0,
      -force / Math.abs(this.p5.height - y),
    );
    const force_left = this.p5.createVector(force / Math.abs(x), 0);
    const force_right = this.p5.createVector(
      -force / Math.abs(this.p5.width - x),
      0,
    );

    this.applyForce(force_top);
    this.applyForce(force_bottom);
    this.applyForce(force_right);
    this.applyForce(force_left);
  }
}

const sketch = (p5: P5) => {
  let movers: Mover[] = [];
  let offset = 0;
  p5.setup = () => {
    p5.frameRate(60);
    p5.createCanvas(800, 800);

    movers.push(
      new Mover(p5, p5.createVector(600, 400), undefined, undefined, 1),
    );
    movers.push(
      new Mover(p5, p5.createVector(400, 400), undefined, undefined, 10),
    );
    movers.push(
      new Mover(p5, p5.createVector(200, 400), undefined, undefined, 100),
    );
    movers.push(
      new Mover(p5, p5.createVector(100, 400), undefined, undefined, 1000),
    );
  };

  p5.draw = () => {
    p5.background(225);

    const gravity = p5.createVector(0, 0.2);
    const wind = p5.createVector(
      p5.map(p5.noise(offset), 0, 1, -0.1, 0.2),
      p5.map(p5.noise(offset + 1000), 0, 1, -0.1, 0.1),
    );
    offset += 0.001;

    movers.forEach((mover) => {
      const scaledGravity = gravity.copy().mult(mover.mass);
      mover.applyForce(scaledGravity);
      mover.applyForce(wind);
      mover.checkEdges();
      if (mover.contactEdges()) {
        //{!5 .bold}
        let c = 0.1;
        let friction = mover.velocity.copy();
        friction.mult(-1);
        friction.setMag(c);

        //{!1 .bold} Apply the friction force vector to the object.
        mover.applyForce(friction);
      }
      mover.checkMouse();
      mover.update();
      mover.show();
    });

    // Line to show wind
    p5.translate(p5.height / 2, p5.width / 2);
    p5.strokeWeight(5);
    p5.stroke(150);
    p5.line(0, 0, wind.x * 1000, wind.y * 1000);
  };
};

export default sketch;
