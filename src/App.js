import React , {Component } from 'react';
import {Navbar, NavbarBrand} from 'reactstrap';
import logo from './logo.svg';
import './App.css';
import './w3school.css';
import Menu from './components/MenuComponent';

import { CONFIG } from './shared/config';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dishes: CONFIG
    };
  }
render(){
  return (
    <div className="App">
      
     <div class ="row row-header">
      <div class="col-sm-1">
      <img clas="img-responsive" src="assets/images/pro1.png" width = "50%"  ></img></div>
      <div class="col-sm-2"> <a href='/index.html'  class='title-font' title='Home'>home</a></div>
      <div class="col-sm-2"> <a href='/index.html' class='title-font' title='List'>group</a>
      </div>
      <div class="col-sm-2"> <a href='/user.html' class='title-font' title='List'>user</a>
      </div>
      <div class="col-sm-2"> <a href='/upload.html' class='title-font' title='List'>list</a>
      </div>
      <div class="col-sm-3"> <a href='/setting.html' class='title-font' title='List'>setting</a>
      </div>

      </div>
      <Menu dishes={this.state.dishes} />
      <div class ="footer fixed-bottom">
      this is footer 
      </div>
      </div>
    
  );
  }
}
export default App;