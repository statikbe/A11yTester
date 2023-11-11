export class Output {
  constructor() {
    this._output = [];
  }

  addOutput(value) {
    this._output.push(value);
  }

  getOutput() {
    return this._output;
  }
}
