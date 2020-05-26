import React , {Component } from 'react';
import Menu from './MenuComponent';
import { CONFIG } from '../shared/config';

const Home = () => {
  return (
    <div className="App">
      <div class ="row row-header">
        <div class="col-sm-1">
          <img alt="" class="img-responsive" src="assets/images/pro1.png" width = "50%"  ></img>
        </div>
        <div class="col-sm-2"> <a href='/index.html'  class='title-font' title='Home'>home</a>
        </div>
        <div class="col-sm-2"> <a href='/index.html' class='title-font' title='List'>group</a>
        </div>
        <div class="col-sm-2"> <a href='/user.html' class='title-font' title='List'>user</a>
        </div>
        <div class="col-sm-2"> <a href='/upload.html' class='title-font' title='List'>list</a>
        </div>
        <div class="col-sm-3"> <a href='/setting.html' class='title-font' title='List'>setting</a>
        </div>
      </div>
      <Menu dishes={CONFIG} />
      <div class ="footer fixed-bottom">
        this is footer 
      </div>
    </div>
  )
}

export default Home;