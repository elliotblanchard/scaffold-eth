import React from 'react'
import {connect} from 'react-redux'
//import {fetchAccounts} from '../actions/fetchAccounts'
import Receivers from '../components/Receivers'

class ReceiversContainer extends React.Component {
  
    //componentDidMount() {
    //    this.props.fetchAccounts()
    //}

    render() {
        return (
            <div>
                <Receivers />
            </div>
        )
    }
} 

const mapStateToProps = state => {
    return {
        //loading: state.loading,         
        //accounts: state.accounts
    }
}

//export default connect(mapStateToProps, {fetchAccounts})(AccountsContainer)
export default connect(mapStateToProps,)(ReceiversContainer)