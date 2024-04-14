import P5 from "p5";

interface Drawable {
  display(): void;
}

interface Positionable {
  position: P5.Vector;
}

interface Collidable {
  collider: BoxCollider2D;
}

class Mover implements Positionable {
  constructor(
    public p5: P5,
    public position: P5.Vector,
    public velocity: P5.Vector,
    public acceleration: P5.Vector,
    public maxVelocity: number,
    public mass: number,
  ) {}

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxVelocity);
    this.velocity.y *= 0.9;
    this.position.add(this.velocity);
    this.acceleration.mult(0);
  }

  applyForce(force: P5.Vector) {
    const f = force.copy();
    f.div(this.mass);
    this.acceleration.add(f);
  }
}

class Edge extends Mover {
  collider: BoxCollider2D;
  constructor(p5: P5, position: P5.Vector, width: number, height: number) {
    super(p5, position, p5.createVector(), p5.createVector(), 0, 1);
    this.collider = new BoxCollider2D(this, width, height);
  }

  display(): void {
    return;
  }
}

class BoxCollider2D {
  private listeners: Map<BoxCollider2D, () => void>;
  constructor(
    public mover: Positionable,
    public width: number,
    public height: number,
  ) {
    this.listeners = new Map();
  }

  checkCollision(bc: BoxCollider2D): boolean {
    const x_dist = Math.abs(bc.mover.position.x - this.mover.position.x);
    const y_dist = Math.abs(bc.mover.position.y - this.mover.position.y);

    return (
      x_dist <= (bc.width + this.width) / 2 &&
      y_dist <= (bc.height + this.height) / 2
    );
  }

  checkCollisions() {
    this.listeners.forEach((fn, collider) => {
      if (this.checkCollision(collider)) {
        fn();
      }
    });
  }

  addCollisionListener(bc: BoxCollider2D, fn: () => void) {
    this.listeners.set(bc, fn);
  }

  removeCollisionListener(bc: BoxCollider2D) {
    this.listeners.delete(bc);
  }
}

class Bird extends Mover implements Drawable, Collidable {
  collider: BoxCollider2D;
  jumpVector: P5.Vector;
  isDead: boolean = false;
  highlight: boolean = false;
  constructor(
    public p5: P5,
    public position: P5.Vector,
    public velocity: P5.Vector,
    public acceleration: P5.Vector,
    public maxVelocity: number,
    public mass: number,
    public radius: number,
    public jumpForce: number,
  ) {
    super(p5, position, velocity, acceleration, maxVelocity, mass);
    this.radius = radius;
    this.collider = new BoxCollider2D(this, radius * 2, radius * 2);
    this.jumpForce = jumpForce;
    this.jumpVector = p5.createVector(0, -1).mult(jumpForce);
  }

  update(): void {
    super.update();
  }

  display(): void {
    const p5 = this.p5;
    p5.stroke(0);
    if (this.highlight) {
      p5.fill(255);
    } else {
      p5.fill(0);
    }
    p5.strokeWeight(2);
    p5.circle(this.position.x, this.position.y, this.radius * 2);
    this.highlight = false;
  }

  jump() {
    console.log("jump");
    this.applyForce(this.jumpVector);
  }

  die() {
    this.isDead = true;
  }
}

class Pipe implements Drawable, Positionable, Collidable {
  collider: BoxCollider2D;
  constructor(
    public p5: P5,
    public position: P5.Vector,
    public width: number,
    public height: number,
  ) {
    this.collider = new BoxCollider2D(this, width, height);
  }

  display(): void {
    const p5 = this.p5;
    p5.push();
    p5.fill(0, 255, 0);
    p5.rect(
      this.position.x - this.width / 2,
      this.position.y - this.height / 2,
      this.width,
      this.height,
    );
    p5.pop();
  }
}

class PipeCouple implements Drawable {
  public top_pipe: Pipe;
  public bottom_pipe: Pipe;
  public colliders: BoxCollider2D[];
  public gap_collider: BoxCollider2D;
  constructor(
    public p5: P5,
    public x: number,
    public elevation: number,
    public gap: number = 150,
    public width: number = 50,
    public speed: number = 2,
  ) {
    const top_pipe_height = elevation - gap / 2;
    const top_pipe_y = top_pipe_height / 2;

    const bottom_pipe_height = p5.height - top_pipe_height - gap;
    const bottom_pipe_y = p5.height - bottom_pipe_height / 2;

    this.top_pipe = new Pipe(
      p5,
      p5.createVector(x, top_pipe_y),
      width,
      top_pipe_height,
    );
    this.bottom_pipe = new Pipe(
      p5,
      p5.createVector(x, bottom_pipe_y),
      width,
      bottom_pipe_height,
    );

    this.colliders = [this.top_pipe.collider, this.bottom_pipe.collider];

    this.gap_collider = new BoxCollider2D(
      { position: p5.createVector(x, elevation) },
      width,
      gap,
    );
  }
  display(): void {
    this.top_pipe.display();
    this.bottom_pipe.display();
  }

  update() {
    this.x -= this.speed;
    this.top_pipe.position.x -= this.speed;
    this.bottom_pipe.position.x -= this.speed;
    this.gap_collider.mover.position.x -= this.speed;
  }

  offscreen() {
    return this.x < -this.width;
  }
}

const sketch = (p5: P5) => {
  let bird: Bird;
  let gravity: P5.Vector;
  let ground: Edge;
  let ceiling: Edge;
  let bird_initial_position: P5.Vector;
  let pipes: PipeCouple[] = [];
  let score = 0;
  const FRAME_RATE = 60;

  function restart() {
    bird.isDead = false;
    bird.position = bird_initial_position.copy();
  }

  function addPipe() {
    const elevation = p5.random(p5.height / 5, p5.height - p5.height / 5);
    const pipe = new PipeCouple(p5, p5.width + 20, elevation);
    pipes.push(pipe);
    pipe.colliders.forEach((collider) => {
      bird.collider.addCollisionListener(collider, () => {
        bird.highlight = true;
      });
    });

    bird.collider.addCollisionListener(pipe.gap_collider, () => {
      score++;
      console.log("score: ", score);
      bird.collider.removeCollisionListener(pipe.gap_collider);
    });
  }

  p5.setup = () => {
    p5.createCanvas(500, 700);
    p5.frameRate(FRAME_RATE);

    bird_initial_position = p5.createVector(p5.width / 2, p5.height / 4);

    gravity = p5.createVector(0, 1);

    ground = new Edge(
      p5,
      p5.createVector(p5.width / 2, p5.height),
      p5.width,
      2,
    );

    ceiling = new Edge(p5, p5.createVector(p5.width / 2, 0), p5.width, 2);

    bird = new Bird(
      p5,
      bird_initial_position.copy(),
      p5.createVector(), // velocity
      p5.createVector(), // acceleration
      15, // maximum velocity
      1, // mass
      16, // radius
      100, // jump force
    );

    bird.collider.addCollisionListener(ground.collider, () => {
      bird.position.y = p5.height - bird.radius - 5;
    });

    bird.collider.addCollisionListener(ceiling.collider, () => {
      bird.position.y = ceiling.position.y + bird.radius + 2;
    });

    addPipe();
  };

  p5.draw = () => {
    p5.background(250);

    p5.push();
    p5.textSize(p5.height / 4);
    p5.fill(255);
    p5.stroke(0);
    p5.strokeWeight(4);
    p5.text(score, p5.width / 2, p5.height / 2);
    p5.pop();

    bird.applyForce(gravity);
    bird.update();
    bird.display();
    bird.collider.checkCollisions();

    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].update();
      pipes[i].display();

      if (pipes[i].offscreen()) {
        pipes[i].colliders.forEach((collider) => {
          bird.collider.removeCollisionListener(collider);
        });
        bird.collider.removeCollisionListener(pipes[i].gap_collider);
        pipes.splice(i, 1);
      }
    }

    if (p5.frameCount % 120 == 0) {
      addPipe();
    }
  };

  p5.keyPressed = () => {
    if (p5.keyCode === p5.UP_ARROW) {
      bird.jump();
    }
    if (p5.keyCode === 32) {
      restart();
    }
  };
};

export default sketch;
