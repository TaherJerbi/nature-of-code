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
  constructor(p5: P5, start: Circle, end: Circle) {
    this.p5 = p5;
    this.start = start;
    this.end = end;
    this.drawn_end = p5.createVector(start.position.x, start.position.y);
  }
  display() {
    this.update();
    this.p5.line(
      this.start.position.x,
      this.start.position.y,
      this.drawn_end.x,
      this.drawn_end.y,
    );
  }

  update() {
    //interpolate points between start and end to ;ake an efffect of a line getting longer
    if (this.drawn_end.dist(this.end.position) > 0.5) {
      this.drawn_end = P5.Vector.lerp(this.drawn_end, this.end.position, 0.5);
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
  parent: Rectangle;
  propagated: boolean = false;
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
    this.velocity = p5.createVector(p5.random(-1, 1), p5.random(-1, 1));
    // this.velocity = p5.createVector(0, 0);
    this.parent = parent;
    // console.log(
    //   "the edges are ",
    //   this.parent.x + this.radius,
    //   this.parent.y + this.radius,
    //   this.parent.x + this.parent.width - this.radius,
    //   this.parent.y + this.parent.height - this.radius,
    //   "the postion widht height and radius individualy are",
    //   this.position.x,
    //   this.position.y,
    //   this.parent.width,
    //   this.parent.height,
    //   this.radius
    // );
  }

  getNeighbours() {
    const neighbours = [];
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
    console.log(
      "neighbours of ",
      this.parent.i,
      this.parent.j,
      "are",
      neighbours.map(
        (neighbour) => neighbour.parent.i + " " + neighbour.parent.j,
      ),
    );
    return neighbours;
  }

  propagate_while_creating_lines_to_neighbours() {
    this.propagated = true;
    const neighbours = this.getNeighbours();
    neighbours.forEach((neighbour) => {
      console.log(
        "     creating line from ",
        this.parent.i,
        this.parent.j,
        "to",
        neighbour.parent.i,
        neighbour.parent.j,
      );
      lineList.push(new Line(this.p5, this, neighbour));
    });
  }

  display() {
    this.update();
    this.p5.circle(this.position.x, this.position.y, this.radius);
  }

  update() {
    if (this.radius < this.inter_radius && this.propagated) {
      this.radius += 0.5;
    }
    this.position.add(this.velocity);
    this.checkEdges();
  }

  checkEdges() {
    if (
      this.position.x >
        this.parent.x + this.parent.width - this.inter_radius / 2 ||
      this.position.x < this.parent.x + this.inter_radius / 2
    ) {
      this.velocity.x =
        this.p5.random(0, 1) *
        (this.position.x < this.parent.x + this.inter_radius / 2 ? 1 : -1);
    }
    if (
      this.position.y >
        this.parent.y + this.parent.height - this.inter_radius / 2 ||
      this.position.y < this.parent.y + this.inter_radius / 2
    ) {
      this.velocity.y =
        this.p5.random(0, 1) *
        (this.position.y < this.parent.y + this.inter_radius / 2 ? 1 : -1);
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
    p5.frameRate(120);
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
    console.log("stating propagation from ", i, j);
  };

  p5.draw = () => {
    p5.background(220);
    lineList.forEach((line) => {
      line.display();
    });
    tile_array.forEach((row) => {
      row.forEach((element) => {
        // element.display();
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
