import React , {Component } from 'react';
import {Navbar, NavbarBrand} from 'reactstrap';
import logo from './logo.svg';
import './App.css';
import './w3school.css';
import Menu from './components/MenuComponent';

import { DISHES } from './shared/dishes';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dishes: DISHES
    };
  }
render(){
  return (
    <div className="App">
      
     <div class ="row row-header">
      <div class="col-sm-1">
      <img clas="img-responsive" src="logo192.png" width = "100%"  ></img></div>
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