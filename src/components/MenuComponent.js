import React, { Component } from 'react';
import { Card, CardImg, CardImgOverlay, CardTitle } from 'reactstrap';
import DishDetail from './DishDetailComponents'

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
            <div key={dish.id} className='col-2 '>
                 <Card onClick={() => this.onSelectedDish(dish)} >
                       <CardImg width="100%" src={dish.image} alt={dish.name} />
                       <CardImgOverlay>
                           <CardTitle >{dish.name}</CardTitle>
                    </CardImgOverlay>
                </Card>
                </div>
        );
       });
        return (
            <div className="container">
                <div className="row">
                    {menu}
                </div>
                <DishDetail dish={this.state.selectedDish}></DishDetail>
            </div>
        );
    }
}

export default Menu; 