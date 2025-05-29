import P5 from "p5";

const sketch = await import(`.${window.location.pathname}`);

new P5(sketch.default, document.body.querySelector("#app") as HTMLElement);
