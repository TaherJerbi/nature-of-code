import P5 from "p5";

class Baton {
  constructor(
    private p5: P5,
    public position: P5.Vector = p5.createVector(),
    public length: number = 120,
    public radius: number = 32,
    public rotation: number = 0,
    public angularVelocity: number = 0,
    public angularAcceleration: number = 0,
    public maxAngularVelocity: number = 0.1,
  ) {}

  show() {
    const p5 = this.p5;

    p5.push();
    p5.translate(this.position);
    p5.rotate(this.rotation);
    p5.line(-this.length / 2, 0, this.length / 2, 0);
    p5.circle(this.length / 2, 0, this.radius);
    p5.circle(-this.length / 2, 0, this.radius);
    p5.strokeWeight(2);
    p5.pop();
  }

  update() {
    this.angularVelocity += this.angularAcceleration;
    this.angularVelocity = Math.min(
      this.angularVelocity,
      this.maxAngularVelocity,
    );
    this.angularVelocity *= 0.99;
    this.rotation += this.angularVelocity;
    this.angularAcceleration = 0;
  }

  applyAngularForce(f: number) {
    this.angularAcceleration += f;
  }
}
import { Mover } from "./forces";
class Spaceship extends Mover {
  public angle: number = 0;
  public highlighted: boolean = false;
  update(): void {
    super.update();
    this.velocity.limit(10);
  }

  show() {
    const p5 = this.p5;
    p5.push();
    p5.translate(this.position);
    // if (this.velocity.mag() > 0.1) {
    //   this.angle = this.velocity.heading();
    // }
    p5.rotate(this.angle);
    p5.fill(0);
    if (this.highlighted) {
      p5.fill(255, 0, 0);
    }
    p5.stroke(0);
    p5.strokeWeight(2);
    p5.rect(0, 0, 20, 10);
    p5.rect(22, 0, 10, 2);
    p5.pop();
  }
}

const sketch = (p5: P5) => {
  let baton: Baton;
  let spaceship: Spaceship;
  let forceMag = 0.5;
  let theta = 0;
  let r = 0;
  let preriod = 120;
  let amplitude = 100;

  p5.setup = () => {
    p5.createCanvas(800, 800);
    p5.frameRate(60);
    p5.rectMode("center");
    baton = new Baton(p5, p5.createVector(p5.width / 2 + 200, p5.height / 2));
    spaceship = new Spaceship(p5, p5.createVector(p5.width / 2, p5.height / 2));
  };

  p5.draw = () => {
    p5.background(250);
    if (p5.keyIsDown(p5.LEFT_ARROW)) {
      spaceship.angle -= 0.1;
    }
    if (p5.keyIsDown(p5.RIGHT_ARROW)) {
      spaceship.angle += 0.1;
    }
    if (p5.keyIsDown(p5.UP_ARROW)) {
      // Force pointing in the direction of the spaceship
      let force = p5.createVector(1, 0).mult(forceMag);
      force.rotate(spaceship.angle);
      spaceship.applyForce(force);
      spaceship.highlighted = true;
    } else {
      spaceship.highlighted = false;
    }
    spaceship.applyFriction(0.1);
    spaceship.update();
    spaceship.show();

    for (let i = 0; i < 1; i++) {
      p5.push();
      let pos = P5.Vector.fromAngle(theta).mult(r);
      p5.translate(p5.width / 2, p5.height / 2);
      p5.stroke(0);
      p5.fill(0);
      p5.circle(pos.x, pos.y, 32);
      p5.pop();
      theta += 0.05;
      r += p5.sin(theta) ** 2;
    }

    p5.push();
    p5.translate(p5.width / 2, p5.height / 2);
    p5.stroke(0);
    p5.fill(0);
    let x = amplitude * p5.sin((p5.TWO_PI * p5.frameCount) / preriod);
    p5.circle(x, 0, 32);
    p5.line(0, 0, x, 0);
    theta += 0.05;
    p5.pop();
  };
};

export default sketch;
