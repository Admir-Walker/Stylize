import React, { Component } from "react";

//import Three from "./components/three";
import Stylize from "./components/Stylize";

export default class App extends Component {
  render() {
    return (
      <div>
        <Stylize defaultSelected="legs" modelPath="https://s3-us-west-2.amazonaws.com/s.cdpn.io/1376484/chair.glb" />
      </div>
    );
  }
}
