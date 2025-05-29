import P5 from "p5";

export class Wave {
  constructor(
    protected p5: P5,
    public amplitude: number,
    public period: number,
    public phase: number,
    public phase_velocity: number = 0,
  ) {}

  evaluate(x: number) {
    return (
      this.p5.sin(this.phase + (this.p5.TWO_PI * x) / this.period) *
      this.amplitude
    );
  }

  update() {
    this.phase += this.phase_velocity;
  }
}

const sketch = (p5: P5) => {
  let waves: Wave[] = [];
  let add_button: P5.Element;
  let remove_button: P5.Element;
  let diameter_slider: P5.Element;
  let spacing_slider: P5.Element;

  p5.setup = () => {
    p5.createCanvas(window.innerWidth, window.innerHeight);
    p5.frameRate(60);

    add_button = p5.createButton("Add Wave");
    remove_button = p5.createButton("Remove Wave");
    diameter_slider = p5.createSlider(1, 50, 5, 0.5);
    spacing_slider = p5.createSlider(1, 50, 5, 0.5);

    add_button.mouseClicked(() => {
      waves.push(
        new Wave(
          p5,
          p5.random(10, 300),
          p5.random(200, 800),
          p5.random(p5.TWO_PI),
          0.01,
        ),
      );
    });
    remove_button.mouseClicked(() => {
      waves.splice(0, 1);
    });

    for (let i = 0; i < 2; i++) {
      waves.push(
        new Wave(
          p5,
          p5.random(10, 300),
          p5.random(200, 800),
          p5.random(p5.TWO_PI),
          0.01,
        ),
      );
    }
  };

  p5.draw = () => {
    p5.background(155, 0, 155);
    const spacing = +spacing_slider.value();
    const d = +diameter_slider.value();

    for (let x = 0; x < p5.width + d; x += spacing) {
      let y = 0;
      for (let wave of waves) {
        y += wave.evaluate(x) / waves.length;
        let wave_y = wave.evaluate(x);
        p5.noStroke();
        p5.fill(0, 50);
        p5.circle(x, wave_y + p5.height / 2, d);
      }
      p5.noStroke();
      p5.fill(255);
      p5.circle(x, y + p5.height / 2, d);
    }

    for (let wave of waves) {
      wave.update();
    }
  };
};

export default sketch;
