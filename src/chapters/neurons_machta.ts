import P5 from "p5";
let viewportWidth = window.innerWidth;
let viewportHeight = window.innerHeight;

let itemWidth = viewportWidth / 12;
let itemHeight = viewportHeight / 12;
const gap = Math.min(itemWidth, itemHeight) * 0.4;
const factor = 0.4;
let numColumns = Math.floor((viewportWidth - 0) / itemWidth);
let numRows = Math.floor((viewportHeight - 0) / itemHeight);

let tile_array: Rectangle[][] = [];
let lineList: Line[] = [];
//initialize the line list

function get_element(x: number, y: number) {
  return tile_array[y][x];
}

class Line {
  p5: P5;
  start: Circle;
  end: Circle;
  drawn_end: P5.Vector;
  step: number = 0;
  constructor(p5: P5, start: Circle, end: Circle) {
    this.p5 = p5;
    this.start = start;
    this.end = end;
    this.drawn_end = p5.createVector(start.position.x, start.position.y);
  }
  display() {
    this.update();
    this.p5.push();
    this.p5.stroke(255, 155, 0);
    this.p5.strokeWeight(10);
    this.p5.line(
      this.start.position.x,
      this.start.position.y,
      this.drawn_end.x,
      this.drawn_end.y,
    );
    this.p5.pop();
  }

  update() {
    //interpolate points between start and end to ;ake an efffect of a line getting longer
    if (this.step < 1) {
      this.drawn_end = P5.Vector.lerp(
        this.start.position,
        this.end.position,
        this.step,
      );
      this.step += 0.1;
    } else {
      this.drawn_end = this.end.position;
      if (!this.end.propagated) {
        this.end.propagate_while_creating_lines_to_neighbours();
      }
    }
  }
}
class Circle {
  p5: P5;
  position: P5.Vector;
  inter_radius: number;
  initial_radius: number = 0;
  radius: number;
  velocity: P5.Vector;
  acceleration: P5.Vector;
  parent: Rectangle;
  step: number;
  propagated: boolean = false;
  dragging: boolean;
  dragStart: P5.Vector | undefined;
  dragEnd: P5.Vector | undefined;
  dragAverageVelocity: P5.Vector | undefined;
  dragOffset: P5.Vector | undefined;
  constructor(
    p5: P5,
    x: number,
    y: number,
    inter_radius: number,
    parent: Rectangle,
  ) {
    this.p5 = p5;
    this.position = p5.createVector(x, y);
    this.inter_radius = inter_radius;
    this.radius = this.initial_radius;
    this.step = 0;
    this.velocity = p5.createVector(0, 0);
    this.acceleration = p5.createVector(0, 0);
    this.parent = parent;

    this.dragging = false;
    this.dragStart = p5.createVector(0, 0);
  }

  getNeighbours() {
    const neighbours: Circle[] = [];
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        if (i === 0 && j === 0) continue;
        if (
          this.parent.i + i >= 0 &&
          this.parent.j + j >= 0 &&
          this.parent.i + i < numColumns &&
          this.parent.j + j < numRows
        ) {
          neighbours.push(
            get_element(this.parent.i + i, this.parent.j + j).circle,
          );
        }
      }
    }
    return neighbours;
  }

  propagate_while_creating_lines_to_neighbours() {
    this.propagated = true;
    const neighbours = this.getNeighbours();
    neighbours.forEach((neighbour) => {
      if (neighbour.propagated) return;
      lineList.push(new Line(this.p5, this, neighbour));
    });
  }

  attractNeighbours() {
    const neighbours = this.getNeighbours();
    neighbours.forEach((neighbour) => {
      const force = P5.Vector.sub(this.position, neighbour.position);
      const distance = force.mag();
      const strength = 0.01;
      force.normalize();
      force.mult(strength);
      if (distance < this.radius) {
        force.mult(-1);
        force.mult(1 - distance / this.inter_radius);
      }
      neighbour.applyForce(force);
    });
  }

  display() {
    this.update();
    this.p5.push();
    this.p5.fill(255, 100, 0);
    this.p5.noStroke();
    this.p5.circle(this.position.x, this.position.y, this.radius);
  }

  update() {
    if (this.step < 1 && this.propagated) {
      this.radius = this.p5.lerp(this.radius, this.inter_radius, this.step);
      this.step += 0.01;
    }
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.checkEdges();
    this.acceleration.mult(0);
  }

  checkEdges() {
    if (
      this.position.x >
      this.parent.x + this.parent.width - this.inter_radius / 2
    ) {
      this.position.x =
        this.parent.x + this.parent.width - this.inter_radius / 2;
      this.velocity.x *= -1;
    }
    if (this.position.x < this.parent.x + this.inter_radius / 2) {
      this.position.x = this.parent.x + this.inter_radius / 2;
      this.velocity.x *= -1;
    }
    if (
      this.position.y >
      this.parent.y + this.parent.height - this.inter_radius / 2
    ) {
      this.position.y =
        this.parent.y + this.parent.height - this.inter_radius / 2;
      this.velocity.y *= -1;
    }
    if (this.position.y < this.parent.y + this.inter_radius / 2) {
      this.position.y = this.parent.y + this.inter_radius / 2;
      this.velocity.y *= -1;
    }
  }

  applyForce(force: P5.Vector) {
    const f = force.copy();
    f.div(1); // TODO: this.mass
    this.acceleration.add(f);
    this.acceleration.limit(10);
  }

  checkMouse() {
    if (this.p5.mouseIsPressed) {
      const mouse = this.p5.createVector(this.p5.mouseX, this.p5.mouseY);
      const offset = mouse.copy().sub(this.position);
      if (offset.mag() < this.radius) {
        if (!this.dragging) {
          this.dragStart = this.position.copy();
          this.dragOffset = offset;
          this.inter_radius = this.inter_radius * 0.8;
          this.step = 0;
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
        this.getNeighbours().forEach((neighbour) => {
          neighbour.attractNeighbours();
        });
      }
    } else {
      if (this.dragging && this.dragStart) {
        this.dragEnd = this.position.copy();
        this.applyForce(
          this.dragAverageVelocity?.normalize()?.mult(0) ??
            this.p5.createVector(0, 0),
        );
        this.inter_radius = this.inter_radius / 0.8;
        this.step = 0;
        this.dragStart = undefined;
        this.dragEnd = undefined;
      }
      this.dragging = false;
    }
  }
}

class Rectangle {
  p5: P5;
  i: number;
  j: number;
  x: number;
  y: number;
  width: number;
  height: number;
  circle: Circle;
  constructor(
    p5: P5,
    i: number,
    j: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    this.p5 = p5;
    this.i = i;
    this.j = j;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    const offset_x = Math.random() * width * factor - (width * factor) / 2;
    const offset_y = Math.random() * height * factor - (height * factor) / 2;
    this.circle = new Circle(
      this.p5,
      x + offset_x + width / 2,
      y + offset_y + height / 2,
      Math.min(width, height) - gap,
      this,
    );
  }

  display() {
    this.p5.rect(this.x, this.y, this.width, this.height);
  }
}

const sketch = (p5: P5) => {
  p5.setup = () => {
    p5.frameRate(60);
    p5.createCanvas(viewportWidth, viewportHeight);
    for (let j = 0; j < numColumns; j++) {
      tile_array.push([]);
      for (let i = 0; i < numRows; i++) {
        const x = j * itemWidth;
        const y = i * itemHeight;
        let rect = new Rectangle(p5, i, j, x, y, itemWidth, itemHeight);
        tile_array[j].push(rect);
      }
    }

    //randomly select a rectangle and start the propagation
    const i = Math.floor(Math.random() * numColumns);
    const j = Math.floor(Math.random() * numRows);
    tile_array[i][j].circle.propagate_while_creating_lines_to_neighbours();
    window.addEventListener("resize", onResize);
  };

  p5.draw = () => {
    p5.background(255);
    lineList.forEach((line) => {
      line.display();
    });
    tile_array.forEach((row) => {
      row.forEach((element) => {
        element.circle.checkMouse();
        element.circle.attractNeighbours();
        element.circle.display();
      });
    });
  };

  function onResize() {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    itemWidth = viewportWidth / 20;
    itemHeight = viewportHeight / 20;
    numColumns = Math.floor((viewportWidth - 0) / itemWidth);
    numRows = Math.floor((viewportHeight - 0) / itemHeight);
    tile_array = [];
    for (let j = 0; j < numColumns; j++) {
      tile_array.push([]);
      for (let i = 0; i < numRows; i++) {
        const x = j * itemWidth;
        const y = i * itemHeight;
        let rect = new Rectangle(p5, i, j, x, y, itemWidth, itemHeight);
        tile_array[j].push(rect);
      }
    }
    p5.resizeCanvas(viewportWidth, viewportHeight);
  }
};

export default sketch;
