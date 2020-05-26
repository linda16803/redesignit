import React, { Component, useState } from 'react';
import { Card, CardImg, CardImgOverlay, CardTitle } from 'reactstrap';
import DishDetail from './DishDetailComponents'
import CardFooter from 'reactstrap/lib/CardFooter';
import {BrowserRouter as Router, Switch, Route, Link, Redirect} from 'react-router-dom';

const Menu = props => {
  const {dishes} = props;
  const [selectedDish, setSelectedDish] = useState(null);
  const [dishLink, setDishLink] = useState(null);

  function onSelectedDish(dish) {
    setSelectedDish(dish);
  }

  function leaveDishCard(dish) {
    setSelectedDish(null);
  }

  function changeDishName(name) {
    setDishLink(name);
  }

  return (
      <div className="container">
        <div className="row">
          <div className='col-12 with-margin'></div>
        </div>
        <div className="row">
        {dishes.map((dish) => (
        <div key={dish.id} className='col-2 spacer5 '>
          <Card className="text-center" 
            onMouseEnter={() => onSelectedDish(dish)} 
            onMouseLeave={() => leaveDishCard(dish)}
            onClick={() => changeDishName(dish.name)}>
            {dishLink === "Upload" && <Redirect to="/upload">{dish.name}</Redirect>}
            <CardImg className="img" width="50%" src={dish.image} alt={dish.name} />
            <CardTitle className="backgroundcolor">{dish.name}</CardTitle>
          </Card>
        </div>
      ))}
      </div>
        <DishDetail dish={selectedDish} style={{height: "50%", width: "50%"}}></DishDetail>
      </div>
    );
}

export default Menu; 