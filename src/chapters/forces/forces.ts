import P5 from "p5";

let dragging: Mover | undefined = undefined;

export class Mover {
  protected p5: P5;
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
    this.diameter = this.mass * 16;
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
    this.p5.push();
    this.p5.stroke(100);
    this.p5.strokeWeight(this.dragging ? 4 : 2);
    const color: P5.Color = this.p5.color(
      255,
      255,
      this.mass * 16 + (this.dragging ? 100 : 150),
    );
    this.p5.fill(color);
    this.p5.circle(this.position.x, this.position.y, this.diameter);
    this.p5.pop();
  }

  contactEdges() {
    return this.position.y > this.p5.height - this.diameter / 2 - 1;
  }

  checkEdges() {
    this._wallBounce();
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

  checkMouse() {
    if (this.p5.mouseIsPressed) {
      const mouse = this.p5.createVector(this.p5.mouseX, this.p5.mouseY);
      const offset = mouse.copy().sub(this.position);
      if (offset.mag() < this.diameter / 2) {
        if (!this.dragging) {
          this.dragStart = this.position.copy();
          this.dragOffset = offset;
        }
        if (dragging !== undefined && dragging !== this) {
          return;
        } else if (dragging === undefined) {
          dragging = this;
        }
        this.dragging = true;
        this.velocity.mult(0);
        this.acceleration.mult(0);
      }

      if (this.dragging) {
        const newPosition = mouse.copy().sub(this.dragOffset ?? this.position);
        const velocity = newPosition.copy().sub(this.position);
        this.dragAverageVelocity = velocity
          .add(this.dragAverageVelocity ?? this.p5.createVector(0, 0))
          .div(2);
        this.position = newPosition;
      }
    } else {
      if (this.dragging && this.dragStart) {
        this.dragEnd = this.position.copy();
        this.applyForce(
          this.dragAverageVelocity?.mult(this.mass) ??
            this.p5.createVector(0, 0),
        );
        this.dragStart = undefined;
        this.dragEnd = undefined;
      }
      dragging = undefined;
      this.dragging = false;
    }
  }

  applyFriction(c: number = 0.01) {
    const friction = this.velocity.copy();
    friction.mult(-1);
    friction.setMag(c);
    this.applyForce(friction);
  }
}

class Environment {
  p5: P5;
  constructor(
    p5: P5,
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public coefficient: number,
    public color: P5.Color = p5.color(0, 0, 155, 100),
  ) {
    this.p5 = p5;
  }

  draw() {
    this.p5.push();
    this.p5.fill(this.color);
    this.p5.noStroke();
    this.p5.rect(this.x, this.y, this.width, this.height);
    this.p5.pop();
  }

  contains(mover: Mover) {
    return (
      mover.position.x > this.x &&
      mover.position.x < this.x + this.width &&
      mover.position.y > this.y &&
      mover.position.y < this.y + this.height
    );
  }

  calculateDrag(mover: Mover) {
    const drag = mover.velocity.copy();

    drag.mult(-1);
    drag.normalize();
    drag.mult(this.coefficient * mover.velocity.magSq());
    return drag.limit(mover.velocity.mag());
  }

  applyDrag(mover: Mover) {
    mover.applyForce(this.calculateDrag(mover));
  }
}

const sketch = (p5: P5) => {
  let movers: Mover[] = [];
  let offset = 0;
  const WATER_ENVIRONMENT_COEFFICIENT = 0.1;
  let water: Environment;
  p5.setup = () => {
    p5.frameRate(60);
    p5.createCanvas(800, 800);

    for (let i = 0; i < 100; i++) {
      movers.push(
        new Mover(
          p5,
          p5.createVector(p5.random(0, p5.width), p5.random(0, p5.height)),
          p5.createVector(),
          undefined,
          p5.random(1, 3),
        ),
      );
    }

    water = new Environment(
      p5,
      0,
      p5.height - 300,
      p5.width,
      300,
      WATER_ENVIRONMENT_COEFFICIENT,
    );
  };

  p5.draw = () => {
    p5.background(250);

    water.draw();

    const gravity = p5.createVector(0, 0.2);
    const wind = p5.createVector(
      p5.map(p5.noise(offset), 0, 1, -0.1, 0.2),
      p5.map(p5.noise(offset + 1000), 0, 1, -0.1, 0.1),
    );
    offset += 0.001;

    movers.forEach((mover) => {
      if (water.contains(mover)) {
        water.applyDrag(mover);
      }

      const scaledGravity = gravity.copy().mult(mover.mass);
      mover.applyForce(scaledGravity);
      mover.checkEdges();

      if (mover.contactEdges()) {
        mover.applyFriction();
      }

      mover.update();
      mover.show();
    });

    // We have to check the mouse in reverse order.
    // This is because when multiple movers are overlapping, the one on top should be the one that is dragged.
    // The one on top is the one that was drawn last.
    // And we draw the movers in order.
    for (let i = 0; i < movers.length; i++) {
      const mover = movers[movers.length - i - 1];
      mover.checkMouse();
    }

    // Line to show wind
    p5.translate(p5.height / 2, p5.width / 2);
    p5.strokeWeight(5);
    p5.stroke(255);
    p5.line(0, 0, wind.x * 1000, wind.y * 1000);
  };
};

export default sketch;
