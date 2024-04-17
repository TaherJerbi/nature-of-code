import P5 from "p5";

const sketch = (p5: P5) => {
  let theta = 0;
  let r = 0;

  p5.setup = () => {
    p5.createCanvas(800, 800);
    p5.frameRate(60);
  };

  p5.draw = () => {
    for (let i = 0; i < 10; i++) {
      p5.push();
      let pos = P5.Vector.fromAngle(theta).mult(r);
      p5.translate(p5.width / 2, p5.height / 2);
      p5.strokeWeight(1);
      const color = p5.map(p5.sin(theta), -1, 1, 0, 255);
      p5.noStroke();
      p5.fill(color, color, 0);
      p5.circle(pos.x, pos.y, 32);
      p5.pop();
      theta += 0.01;
      r += 0.05;
    }
  };
};

export default sketch;
