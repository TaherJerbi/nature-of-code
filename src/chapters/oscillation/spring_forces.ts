import P5 from "p5";
import { Mover as ForcesMover } from "../forces/forces";

class Mover extends ForcesMover {
  public anchored: boolean = false;

  update(): void {
    if (this.anchored) return;

    super.update();
  }

  applyFriction(c?: number): void {
    this.velocity.mult(c ?? 1);
  }

  show() {
    const p5 = this.p5;
    if (this.anchored) {
      this.diameter = 12;
    } else {
      this.diameter = 6;
    }

    p5.push();
    p5.strokeWeight(0);
    p5.fill(155, 0, 0);
    p5.circle(this.position.x, this.position.y, this.diameter);
    p5.pop();
  }
}

class Spring {
  constructor(
    protected p5: P5,
    public anchor: Mover,
    public bob: Mover,
    private resting_length: number = 1,
    private k: number = 0.05,
  ) {}

  evaluateForce() {
    const dir = P5.Vector.sub(this.bob.position, this.anchor.position);
    const dist = dir.mag();
    const extension = dist - this.resting_length;

    const force = dir.normalize().setMag(-extension * this.k);

    return force;
  }

  getExtension() {
    const dir = P5.Vector.sub(this.bob.position, this.anchor.position);
    const dist = dir.mag();
    const extension = dist - this.resting_length;
    return extension;
  }

  show() {
    const p5 = this.p5;
    p5.push();
    p5.strokeWeight(3);
    p5.stroke(Math.max(255, Math.abs(this.getExtension())), 100, 0);
    p5.line(
      this.anchor.position.x,
      this.anchor.position.y,
      this.bob.position.x,
      this.bob.position.y,
    );
    p5.pop();
  }
}

const sketch = (p5: P5) => {
  let movers: Mover[] = [];
  let springs: Spring[] = [];
  let gravity: P5.Vector;
  let wind: P5.Vector;

  let number_of_movers_slider: P5.Element;
  p5.setup = () => {
    p5.createCanvas(window.innerWidth, window.innerHeight);
    p5.frameRate(120);

    number_of_movers_slider = p5.createSlider(2, 800, 800, 1);
    const number_of_movers = +number_of_movers_slider.value();

    for (let i = 0; i <= number_of_movers; i++) {
      movers.push(
        new Mover(p5, p5.createVector(i, i), undefined, undefined, 1),
      );
      if (i % 200 == 0) {
        movers[i].anchored = true;
      }

      if (i > 0) {
        springs.push(new Spring(p5, movers[i - 1], movers[i]));
      }
    }

    gravity = p5.createVector(0, 0.005);
  };

  let noiseOffset = 0;
  p5.draw = () => {
    p5.background(255, 200, 0);

    wind = p5.createVector(
      p5.map(p5.noise(noiseOffset), 0, 1, -0.001, 0.001),
      0,
    );
    noiseOffset += 0.01;
    for (let i = 0; i < 8; i++) {
      for (const spring of springs) {
        const force = spring.evaluateForce();
        spring.bob.applyForce(force);
        spring.anchor.applyForce(force.mult(-1));
      }

      for (const mover of movers) {
        mover.applyForce(wind);
        mover.applyForce(gravity);
        mover.applyFriction(0.99);
        mover.checkEdges();
        mover.update();
        mover.checkMouse();
      }
    }
    for (const spring of springs) {
      spring.show();
    }
    for (const mover of movers) {
      mover.show();
    }
  };
};

export default sketch;
