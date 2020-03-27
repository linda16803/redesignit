import React, { Component } from 'react';
import { Card, CardImg, CardImgOverlay, CardTitle } from 'reactstrap';
import DishDetail from './DishDetailComponents'
import CardFooter from 'reactstrap/lib/CardFooter';

class Menu extends Component {

    constructor(props) {
        super(props);

        this.state = {
            selectedDish: null
        }
    }

    onSelectedDish(dish) {
        this.setState({
            selectedDish: dish
        })
    }

    render() {
        const menu = this.props.dishes.map((dish) => {
          return (
            <div key={dish.id} className='col-2 spacer5 '>
                 <Card className="text-center" onClick={() => this.onSelectedDish(dish)} >
                 
                       <CardImg className="img" width="50%" src={dish.image} alt={dish.name} />
                       
                    <CardTitle className="backgroundcolor">{dish.name}</CardTitle>
                    
                </Card>
                
                </div>
        );
       });
        return (
            <div className="container">
                <div className="row">
                <div className='col-12 with-margin'></div>
                </div>
            
                <div className="row">
                    {menu}
                </div>
                <DishDetail dish={this.state.selectedDish}></DishDetail>
            </div>
        );
    }
}

export default Menu; 