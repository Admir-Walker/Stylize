import React, { Component } from "react";
import { SketchPicker } from "react-color";

export default class ColorPicker extends Component {
  render() {
    return (
      <div>
        <SketchPicker
          color={this.props.color}
          onChangeComplete={this.props.handleChangeComplete}
        />
      </div>
    );
  }
}
