import React , {Component } from 'react';
import {Navbar, NavbarBrand} from 'reactstrap';
import logo from './logo.svg';
import './App.css';
import './w3school.css';
import Menu from './components/MenuComponent';
import {BrowserRouter as Router, Switch, Route, } from 'react-router-dom';
import Upload from './components/Upload';
import Home from './components/Home';

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
    <>
    <Router>
      <Switch>
        <Route path="/" component={Home} exact />
        <Route path="/upload" component={Upload}/>
      </Switch>
    </Router>
    </>
  );
  }
}
export default App;