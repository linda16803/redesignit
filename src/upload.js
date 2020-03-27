import React from 'react';
import ReactDOM from 'react-dom';

import Upload from './Upload';
import * as serviceWorker from './serviceWorker';
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css';
import './App.css';

ReactDOM.render(<Upload />, document.getElementById('upload'));


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
